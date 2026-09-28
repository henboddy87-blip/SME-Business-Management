import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.purchase import (
    PurchaseOrder, PurchaseOrderItem,
    Purchase, PurchaseItem,
    PurchaseReturn, PurchaseReturnItem
)
from app.models.warehouse import Warehouse, WarehouseStock
from app.models.inventory import StockMovement
from app.models.partner import Supplier
from app.models.product import Product
from app.models.finance import Payment
from app.models.organization import Organization
from app.models.user import User
from app.schemas.purchase import (
    PurchaseOrderResponse, PurchaseOrderCreate,
    PurchaseResponse, PurchaseCreate,
    PurchaseReturnResponse, PurchaseReturnCreate
)
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles
from app.services.audit_service import log_audit_event
from datetime import datetime, timezone

router = APIRouter()

# ----------------- PURCHASE ORDERS -----------------
@router.get("/orders", response_model=List[PurchaseOrderResponse])
def list_purchase_orders(
    status_filter: Optional[str] = None,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    query = db.query(PurchaseOrder).filter(PurchaseOrder.organization_id == tenant.id)
    if status_filter:
        query = query.filter(PurchaseOrder.status == status_filter)
    orders = query.order_by(PurchaseOrder.created_at.desc()).all()
    
    res = []
    for po in orders:
        pod = PurchaseOrderResponse.model_validate(po)
        if po.supplier:
            pod.supplier_name = po.supplier.name
        if po.warehouse:
            pod.warehouse_name = po.warehouse.name
        res.append(pod)
    return res

@router.post("/orders", response_model=PurchaseOrderResponse)
def create_purchase_order(
    data: PurchaseOrderCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    po_number = "PO-" + str(uuid.uuid4())[:8].upper()
    subtotal = sum(i.quantity * i.unit_cost for i in data.items)
    total = subtotal - data.discount + data.tax

    po = PurchaseOrder(
        organization_id=tenant.id,
        po_number=po_number,
        supplier_id=data.supplier_id,
        warehouse_id=data.warehouse_id,
        status="Pending",
        subtotal=subtotal,
        discount=data.discount,
        tax=data.tax,
        total=total,
        expected_delivery_date=data.expected_delivery_date,
        notes=data.notes,
        created_by=current_user.id
    )
    db.add(po)
    db.flush()

    for item in data.items:
        item_subtotal = item.quantity * item.unit_cost
        po_item = PurchaseOrderItem(
            organization_id=tenant.id,
            purchase_order_id=po.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            received_quantity=0.0,
            unit_cost=item.unit_cost,
            subtotal=item_subtotal
        )
        db.add(po_item)

    log_audit_event(
        db,
        organization_id=tenant.id,
        action="CREATE_PO",
        entity="PurchaseOrder",
        entity_id=po_number,
        user=current_user,
        new_value=f"Created PO {po_number} for total ${total:.2f}"
    )
    db.commit()
    db.refresh(po)
    return po

@router.put("/orders/{po_id}/receive", response_model=PurchaseResponse)
def receive_purchase_order(
    po_id: str,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    """
    Receives goods from a Purchase Order.
    Atomically:
    1. Updates PO status to 'Received'
    2. Creates a Purchase record
    3. Increases inventory in the selected warehouse
    4. Creates auditable Stock Movements
    5. Updates Supplier balance
    """
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id, PurchaseOrder.organization_id == tenant.id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    if po.status == "Received":
        raise HTTPException(status_code=400, detail="This purchase order has already been received")

    purchase_number = "PUR-" + str(uuid.uuid4())[:8].upper()
    purchase = Purchase(
        organization_id=tenant.id,
        purchase_number=purchase_number,
        po_id=po.id,
        supplier_id=po.supplier_id,
        warehouse_id=po.warehouse_id,
        status="Received",
        subtotal=po.subtotal,
        discount=po.discount,
        tax=po.tax,
        total=po.total,
        paid_amount=0.0,
        payment_status="Unpaid",
        notes=f"Auto-generated from PO #{po.po_number}",
        created_by=current_user.id
    )
    db.add(purchase)
    db.flush()

    for item in po.items:
        # 1. Purchase Item
        p_item = PurchaseItem(
            organization_id=tenant.id,
            purchase_id=purchase.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            unit_cost=item.unit_cost,
            subtotal=item.subtotal
        )
        db.add(p_item)

        # 2. Update stock in warehouse
        stk = db.query(WarehouseStock).filter(
            WarehouseStock.warehouse_id == po.warehouse_id,
            WarehouseStock.product_id == item.product_id,
            WarehouseStock.variant_id == item.variant_id,
            WarehouseStock.organization_id == tenant.id
        ).first()

        prev_qty = stk.quantity if stk else 0.0
        new_qty = prev_qty + item.quantity

        if not stk:
            stk = WarehouseStock(
                organization_id=tenant.id,
                warehouse_id=po.warehouse_id,
                product_id=item.product_id,
                variant_id=item.variant_id,
                quantity=item.quantity,
                reserved_quantity=0.0
            )
            db.add(stk)
        else:
            stk.quantity = new_qty

        # 3. Create Stock Movement
        db.add(StockMovement(
            organization_id=tenant.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            warehouse_id=po.warehouse_id,
            movement_type="Purchase",
            quantity=item.quantity,
            previous_quantity=prev_qty,
            new_quantity=new_qty,
            reference_type="Purchase",
            reference_id=purchase_number,
            reason=f"Received PO #{po.po_number}",
            user_id=current_user.id
        ))

        item.received_quantity = item.quantity

    # 4. Update supplier outstanding balance
    supplier = db.query(Supplier).filter(Supplier.id == po.supplier_id, Supplier.organization_id == tenant.id).first()
    if supplier:
        supplier.outstanding_balance += po.total

    po.status = "Received"

    log_audit_event(
        db,
        organization_id=tenant.id,
        action="RECEIVE_PO",
        entity="PurchaseOrder",
        entity_id=po.po_number,
        user=current_user,
        new_value=f"Goods received into inventory from PO #{po.po_number}"
    )

    db.commit()
    db.refresh(purchase)
    return purchase

# ----------------- DIRECT PURCHASES -----------------
@router.get("", response_model=List[PurchaseResponse])
def list_purchases(
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    purchases = db.query(Purchase).filter(Purchase.organization_id == tenant.id).order_by(Purchase.created_at.desc()).all()
    res = []
    for p in purchases:
        pd = PurchaseResponse.model_validate(p)
        if p.supplier:
            pd.supplier_name = p.supplier.name
        if p.warehouse:
            pd.warehouse_name = p.warehouse.name
        res.append(pd)
    return res

@router.post("", response_model=PurchaseResponse)
def create_direct_purchase(
    data: PurchaseCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    """
    Direct Purchase: Immediately receives goods, increases warehouse stock, creates stock movements atomically.
    """
    purchase_number = "PUR-" + str(uuid.uuid4())[:8].upper()
    subtotal = sum(i.quantity * i.unit_cost for i in data.items)
    total = subtotal - data.discount + data.tax

    payment_status = "Paid" if data.paid_amount >= total else ("Partial" if data.paid_amount > 0 else "Unpaid")

    purchase = Purchase(
        organization_id=tenant.id,
        purchase_number=purchase_number,
        po_id=data.po_id,
        supplier_id=data.supplier_id,
        warehouse_id=data.warehouse_id,
        status="Received",
        subtotal=subtotal,
        discount=data.discount,
        tax=data.tax,
        total=total,
        paid_amount=data.paid_amount,
        payment_status=payment_status,
        payment_method=data.payment_method,
        notes=data.notes,
        created_by=current_user.id
    )
    db.add(purchase)
    db.flush()

    for item in data.items:
        p_item = PurchaseItem(
            organization_id=tenant.id,
            purchase_id=purchase.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            unit_cost=item.unit_cost,
            subtotal=item.quantity * item.unit_cost
        )
        db.add(p_item)

        # Increase inventory
        stk = db.query(WarehouseStock).filter(
            WarehouseStock.warehouse_id == data.warehouse_id,
            WarehouseStock.product_id == item.product_id,
            WarehouseStock.variant_id == item.variant_id,
            WarehouseStock.organization_id == tenant.id
        ).first()

        prev_qty = stk.quantity if stk else 0.0
        new_qty = prev_qty + item.quantity

        if not stk:
            stk = WarehouseStock(
                organization_id=tenant.id,
                warehouse_id=data.warehouse_id,
                product_id=item.product_id,
                variant_id=item.variant_id,
                quantity=item.quantity,
                reserved_quantity=0.0
            )
            db.add(stk)
        else:
            stk.quantity = new_qty

        # Record Stock Movement
        db.add(StockMovement(
            organization_id=tenant.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            warehouse_id=data.warehouse_id,
            movement_type="Purchase",
            quantity=item.quantity,
            previous_quantity=prev_qty,
            new_quantity=new_qty,
            reference_type="DirectPurchase",
            reference_id=purchase_number,
            reason="Direct inventory purchase",
            user_id=current_user.id
        ))

    # Record payment if paid
    if data.paid_amount > 0:
        db.add(Payment(
            organization_id=tenant.id,
            payment_number="PAY-" + str(uuid.uuid4())[:8].upper(),
            reference_type="Purchase",
            reference_id=purchase.id,
            supplier_id=data.supplier_id,
            amount_usd=data.paid_amount,
            amount_khr=data.paid_amount * 4100.0,
            currency="USD",
            payment_method=data.payment_method,
            status="Completed",
            payment_date=datetime.now(timezone.utc),
            created_by=current_user.id
        ))

    # Supplier balance adjustment
    unpaid = total - data.paid_amount
    if unpaid > 0:
        supplier = db.query(Supplier).filter(Supplier.id == data.supplier_id, Supplier.organization_id == tenant.id).first()
        if supplier:
            supplier.outstanding_balance += unpaid

    log_audit_event(
        db,
        organization_id=tenant.id,
        action="DIRECT_PURCHASE",
        entity="Purchase",
        entity_id=purchase_number,
        user=current_user,
        new_value=f"Direct purchase {purchase_number} total ${total:.2f}"
    )

    db.commit()
    db.refresh(purchase)
    return purchase

@router.post("/returns", response_model=PurchaseReturnResponse)
def create_purchase_return(
    data: PurchaseReturnCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    purchase = db.query(Purchase).filter(Purchase.id == data.purchase_id, Purchase.organization_id == tenant.id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    return_number = "PRTN-" + str(uuid.uuid4())[:8].upper()
    total_refund = sum(i.quantity * i.unit_cost for i in data.items)

    p_return = PurchaseReturn(
        organization_id=tenant.id,
        return_number=return_number,
        purchase_id=purchase.id,
        supplier_id=purchase.supplier_id,
        total_refund=total_refund,
        reason=data.reason,
        created_by=current_user.id
    )
    db.add(p_return)
    db.flush()

    for item in data.items:
        pr_item = PurchaseReturnItem(
            organization_id=tenant.id,
            purchase_return_id=p_return.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            unit_cost=item.unit_cost,
            refund_amount=item.quantity * item.unit_cost
        )
        db.add(pr_item)

        # Deduct returned stock from warehouse
        stk = db.query(WarehouseStock).filter(
            WarehouseStock.warehouse_id == purchase.warehouse_id,
            WarehouseStock.product_id == item.product_id,
            WarehouseStock.variant_id == item.variant_id,
            WarehouseStock.organization_id == tenant.id
        ).first()

        prev_qty = stk.quantity if stk else 0.0
        new_qty = max(0.0, prev_qty - item.quantity)
        if stk:
            stk.quantity = new_qty

        # Stock Movement
        db.add(StockMovement(
            organization_id=tenant.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            warehouse_id=purchase.warehouse_id,
            movement_type="Purchase Return",
            quantity=-item.quantity,
            previous_quantity=prev_qty,
            new_quantity=new_qty,
            reference_type="PurchaseReturn",
            reference_id=return_number,
            reason=data.reason or "Returned to supplier",
            user_id=current_user.id
        ))

    # Adjust supplier balance
    supplier = db.query(Supplier).filter(Supplier.id == purchase.supplier_id, Supplier.organization_id == tenant.id).first()
    if supplier:
        supplier.outstanding_balance = max(0.0, supplier.outstanding_balance - total_refund)

    log_audit_event(
        db,
        organization_id=tenant.id,
        action="PURCHASE_RETURN",
        entity="PurchaseReturn",
        entity_id=return_number,
        user=current_user,
        new_value=f"Returned goods to supplier, refund ${total_refund:.2f}"
    )

    db.commit()
    db.refresh(p_return)
    return p_return
