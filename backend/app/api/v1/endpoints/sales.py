import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.sale import Sale, SaleItem, SalesReturn, SalesReturnItem
from app.models.product import Product, ProductVariant
from app.models.warehouse import Warehouse, WarehouseStock
from app.models.inventory import StockMovement
from app.models.partner import Customer
from app.models.finance import Payment
from app.models.invoice import Invoice
from app.models.organization import Organization, OrganizationSettings
from app.models.user import User
from app.models.notification import Notification
from app.schemas.sale import (
    SaleResponse, SaleCreate,
    SalesReturnResponse, SalesReturnCreate,
    KHQRPaymentGenerateRequest, KHQRPaymentGenerateResponse
)
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles
from app.services.plan_limit_service import check_plan_limit
from app.services.audit_service import log_audit_event
from app.services.payment_service import payment_service
from app.services.telegram_service import telegram_service

router = APIRouter()

@router.get("", response_model=List[SaleResponse])
def list_sales(
    customer_id: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    payment_method: Optional[str] = None,
    status_filter: Optional[str] = None,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    query = db.query(Sale).filter(Sale.organization_id == tenant.id)
    if customer_id:
        query = query.filter(Sale.customer_id == customer_id)
    if warehouse_id:
        query = query.filter(Sale.warehouse_id == warehouse_id)
    if payment_method:
        query = query.filter(Sale.payment_method == payment_method)
    if status_filter:
        query = query.filter(Sale.status == status_filter)

    sales = query.order_by(Sale.created_at.desc()).all()
    res = []
    for s in sales:
        sd = SaleResponse.model_validate(s)
        if s.customer:
            sd.customer_name = s.customer.name
        if s.warehouse:
            sd.warehouse_name = s.warehouse.name
        if s.salesperson:
            sd.salesperson_name = s.salesperson.full_name
        res.append(sd)
    return res

@router.get("/returns", response_model=List[SalesReturnResponse])
def list_sales_returns(
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    returns = db.query(SalesReturn).filter(SalesReturn.organization_id == tenant.id).order_by(SalesReturn.created_at.desc()).all()
    return returns

@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: str,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    sale = db.query(Sale).filter(Sale.id == sale_id, Sale.organization_id == tenant.id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale record not found")

    sd = SaleResponse.model_validate(sale)
    if sale.customer:
        sd.customer_name = sale.customer.name
    if sale.warehouse:
        sd.warehouse_name = sale.warehouse.name
    if sale.salesperson:
        sd.salesperson_name = sale.salesperson.full_name
    return sd

@router.post("", response_model=SaleResponse)
def complete_sale(
    data: SaleCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Sales Staff"])),
    db: Session = Depends(get_db)
):
    """
    Atomic POS Sale Transaction.
    Executes within an atomic database transaction:
    1. Enforces monthly sales plan limit
    2. Verifies stock availability for every item
    3. Decreases stock from the chosen warehouse
    4. Creates auditable Stock Movements
    5. Creates Sale & SaleItems
    6. Generates Official Invoice
    7. Records Payment
    8. Updates Customer outstanding balance if credit/partial
    9. Logs audit event and fires notification & Telegram alert
    """
    # 1. Enforce SaaS Plan limits
    check_plan_limit(db, tenant.id, "sales")

    if not data.items:
        raise HTTPException(status_code=400, detail="Cannot complete sale with an empty cart")

    # Fetch organization settings for invoice prefix & exchange rate
    org_settings = db.query(OrganizationSettings).filter(OrganizationSettings.organization_id == tenant.id).first()
    invoice_prefix = org_settings.invoice_prefix if org_settings else "INV-"
    exchange_rate = org_settings.khr_exchange_rate if org_settings else (data.exchange_rate or 4100.0)

    # 2. Check stock availability for all cart items first
    cart_items_data = []
    subtotal = 0.0

    for item in data.items:
        product = db.query(Product).filter(Product.id == item.product_id, Product.organization_id == tenant.id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product not found: {item.product_id}")

        # Check stock in warehouse
        stk = db.query(WarehouseStock).filter(
            WarehouseStock.warehouse_id == data.warehouse_id,
            WarehouseStock.product_id == item.product_id,
            WarehouseStock.variant_id == item.variant_id,
            WarehouseStock.organization_id == tenant.id
        ).first()

        current_qty = stk.quantity if stk else 0.0
        if current_qty < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name_en}' in this warehouse. Available: {current_qty}, Requested: {item.quantity}"
            )

        item_subtotal = (item.quantity * item.unit_price) - item.discount
        subtotal += item_subtotal

        cart_items_data.append({
            "product": product,
            "stk": stk,
            "current_qty": current_qty,
            "item_input": item,
            "item_subtotal": item_subtotal
        })

    # Calculations
    discount_amount = data.discount_amount or ((subtotal * data.discount_rate / 100.0) if data.discount_rate else 0.0)
    taxable = max(0.0, subtotal - discount_amount)
    tax_amount = taxable * (data.tax_rate / 100.0) if data.tax_rate else 0.0
    total_usd = taxable + tax_amount
    total_khr = total_usd * exchange_rate

    invoice_number = f"{invoice_prefix}{datetime.now().strftime('%y%m%d')}-{str(uuid.uuid4())[:4].upper()}"

    # Determine payment amounts
    paid_usd = data.paid_amount if data.currency == "USD" else (data.paid_amount / exchange_rate if exchange_rate else data.paid_amount)
    if paid_usd == 0 and data.payment_method in ["Cash", "KHQR", "Card"]:
        # Auto-assume full payment if walk-in standard POS
        paid_usd = total_usd

    change_usd = max(0.0, paid_usd - total_usd)
    payment_status = "Paid" if paid_usd >= total_usd else ("Partial" if paid_usd > 0 else "Unpaid")

    # 3. Create Sale Record
    sale = Sale(
        organization_id=tenant.id,
        invoice_number=invoice_number,
        customer_id=data.customer_id,
        warehouse_id=data.warehouse_id,
        salesperson_id=current_user.id,
        subtotal=subtotal,
        discount_rate=data.discount_rate,
        discount_amount=discount_amount,
        tax_rate=data.tax_rate,
        tax_amount=tax_amount,
        total_amount_usd=total_usd,
        total_amount_khr=total_khr,
        currency=data.currency,
        exchange_rate=exchange_rate,
        payment_method=data.payment_method,
        payment_status=payment_status,
        paid_amount_usd=paid_usd,
        change_amount_usd=change_usd,
        status="Completed",
        notes=data.notes
    )
    db.add(sale)
    db.flush()

    # 4. Process each item: Create SaleItem, reduce stock, record Stock Movement
    low_stock_alerts = []
    for c in cart_items_data:
        p = c["product"]
        stk = c["stk"]
        item_in = c["item_input"]
        prev_qty = c["current_qty"]
        new_qty = prev_qty - item_in.quantity

        # Create SaleItem
        sale_item = SaleItem(
            organization_id=tenant.id,
            sale_id=sale.id,
            product_id=p.id,
            variant_id=item_in.variant_id,
            product_name=p.name_en,
            sku=p.sku,
            quantity=item_in.quantity,
            unit_price=item_in.unit_price,
            unit_cost=p.cost_price,
            discount=item_in.discount,
            subtotal=c["item_subtotal"]
        )
        db.add(sale_item)

        # Update Stock atomically
        stk.quantity = new_qty

        # Record Auditable Stock Movement
        db.add(StockMovement(
            organization_id=tenant.id,
            product_id=p.id,
            variant_id=item_in.variant_id,
            warehouse_id=data.warehouse_id,
            movement_type="Sale",
            quantity=-item_in.quantity,
            previous_quantity=prev_qty,
            new_quantity=new_qty,
            reference_type="Sale",
            reference_id=invoice_number,
            reason=f"POS Sale Invoice #{invoice_number}",
            user_id=current_user.id
        ))

        # Check if product dropped below min stock
        if new_qty <= p.min_stock:
            low_stock_alerts.append((p.name_en, p.sku, new_qty, p.min_stock))

    # 5. Generate Official Invoice
    invoice = Invoice(
        organization_id=tenant.id,
        invoice_number=invoice_number,
        sale_id=sale.id,
        customer_id=data.customer_id,
        issue_date=datetime.now(timezone.utc),
        subtotal=subtotal,
        discount=discount_amount,
        tax=tax_amount,
        total=total_usd,
        paid_amount=min(paid_usd, total_usd),
        status="Paid" if payment_status == "Paid" else "Issued",
        notes=data.notes
    )
    db.add(invoice)

    # 6. Record Payment
    if paid_usd > 0:
        db.add(Payment(
            organization_id=tenant.id,
            payment_number="PAY-" + str(uuid.uuid4())[:8].upper(),
            reference_type="Sale",
            reference_id=sale.id,
            customer_id=data.customer_id,
            amount_usd=min(paid_usd, total_usd),
            amount_khr=min(paid_usd, total_usd) * exchange_rate,
            currency=data.currency,
            payment_method=data.payment_method,
            status="Completed",
            payment_date=datetime.now(timezone.utc),
            created_by=current_user.id
        ))

    # 7. Customer Balance Update
    unpaid_balance = total_usd - paid_usd
    if unpaid_balance > 0 and data.customer_id:
        customer = db.query(Customer).filter(Customer.id == data.customer_id, Customer.organization_id == tenant.id).first()
        if customer:
            customer.outstanding_balance += unpaid_balance

    # 8. Create Notification for new sale
    db.add(Notification(
        organization_id=tenant.id,
        title=f"New Sale: #{invoice_number}",
        message=f"Sale of ${total_usd:.2f} completed via {data.payment_method}.",
        type="new_sale",
        is_read=False,
        link=f"/sales/{sale.id}"
    ))

    # Notifications for any low stock items
    for p_name, sku, rem_qty, min_q in low_stock_alerts:
        db.add(Notification(
            organization_id=tenant.id,
            title=f"Low Stock: {p_name}",
            message=f"{p_name} ({sku}) is low on stock ({rem_qty} remaining, min {min_q}).",
            type="low_stock",
            is_read=False,
            link="/inventory"
        ))

    # 9. Audit Log
    log_audit_event(
        db,
        organization_id=tenant.id,
        action="COMPLETE_SALE",
        entity="Sale",
        entity_id=invoice_number,
        user=current_user,
        new_value=f"Completed sale {invoice_number} of ${total_usd:.2f} ({len(data.items)} items)"
    )

    db.commit()
    db.refresh(sale)

    # 10. Fire optional Telegram Alert
    try:
        telegram_service.notify_new_sale(
            invoice_number=invoice_number,
            total_usd=total_usd,
            total_khr=total_khr,
            items_count=len(data.items),
            business_name=tenant.name,
            chat_id=org_settings.telegram_chat_id if org_settings else None
        )
    except Exception:
        pass

    return get_sale(sale.id, tenant, db)

@router.post("/returns", response_model=SalesReturnResponse)
def create_sales_return(
    data: SalesReturnCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Sales Staff"])),
    db: Session = Depends(get_db)
):
    sale = db.query(Sale).filter(Sale.id == data.sale_id, Sale.organization_id == tenant.id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    return_number = "SRTN-" + str(uuid.uuid4())[:8].upper()
    total_refund = sum(i.quantity * i.unit_price for i in data.items)

    sales_return = SalesReturn(
        organization_id=tenant.id,
        return_number=return_number,
        sale_id=sale.id,
        customer_id=sale.customer_id,
        total_refund_usd=total_refund,
        reason=data.reason,
        created_by=current_user.id
    )
    db.add(sales_return)
    db.flush()

    for item in data.items:
        ret_item = SalesReturnItem(
            organization_id=tenant.id,
            sales_return_id=sales_return.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            refund_amount=item.quantity * item.unit_price
        )
        db.add(ret_item)

        # Restock product in original warehouse
        stk = db.query(WarehouseStock).filter(
            WarehouseStock.warehouse_id == sale.warehouse_id,
            WarehouseStock.product_id == item.product_id,
            WarehouseStock.variant_id == item.variant_id,
            WarehouseStock.organization_id == tenant.id
        ).first()

        prev_qty = stk.quantity if stk else 0.0
        new_qty = prev_qty + item.quantity
        if stk:
            stk.quantity = new_qty
        else:
            stk = WarehouseStock(
                organization_id=tenant.id,
                warehouse_id=sale.warehouse_id,
                product_id=item.product_id,
                variant_id=item.variant_id,
                quantity=item.quantity,
                reserved_quantity=0.0
            )
            db.add(stk)

        # Record Stock Movement
        db.add(StockMovement(
            organization_id=tenant.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            warehouse_id=sale.warehouse_id,
            movement_type="Sales Return",
            quantity=item.quantity,
            previous_quantity=prev_qty,
            new_quantity=new_qty,
            reference_type="SalesReturn",
            reference_id=return_number,
            reason=data.reason or "Customer returned items",
            user_id=current_user.id
        ))

    # Adjust customer balance if credit sale
    if sale.customer_id:
        cust = db.query(Customer).filter(Customer.id == sale.customer_id, Customer.organization_id == tenant.id).first()
        if cust and cust.outstanding_balance > 0:
            cust.outstanding_balance = max(0.0, cust.outstanding_balance - total_refund)

    log_audit_event(
        db,
        organization_id=tenant.id,
        action="SALES_RETURN",
        entity="SalesReturn",
        entity_id=return_number,
        user=current_user,
        new_value=f"Sales return #{return_number} for sale #{sale.invoice_number}, refund ${total_refund:.2f}"
    )

    db.commit()
    db.refresh(sales_return)
    return sales_return
