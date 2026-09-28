import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.inventory import StockMovement, StockAdjustment, StockTransfer, StockTransferItem
from app.models.warehouse import Warehouse, WarehouseStock
from app.models.product import Product, ProductVariant
from app.models.organization import Organization
from app.models.user import User
from app.schemas.inventory import (
    StockMovementResponse, StockAdjustmentCreate, StockAdjustmentResponse,
    StockTransferCreate, StockTransferResponse, StockTransferStatusUpdate
)
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles
from app.services.audit_service import log_audit_event

router = APIRouter()

@router.get("/stock")
def get_inventory_stock_summary(
    warehouse_id: Optional[str] = None,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    query = db.query(
        WarehouseStock.id,
        WarehouseStock.warehouse_id,
        WarehouseStock.product_id,
        WarehouseStock.variant_id,
        WarehouseStock.quantity,
        WarehouseStock.reserved_quantity,
        Warehouse.name.label("warehouse_name"),
        Product.name_en.label("product_name"),
        Product.sku.label("product_sku"),
        Product.cost_price,
        Product.selling_price,
        Product.min_stock,
        Product.max_stock
    ).join(Warehouse, WarehouseStock.warehouse_id == Warehouse.id)\
     .join(Product, WarehouseStock.product_id == Product.id)\
     .filter(WarehouseStock.organization_id == tenant.id)

    if warehouse_id:
        query = query.filter(WarehouseStock.warehouse_id == warehouse_id)

    rows = query.all()
    result = []
    for r in rows:
        status_calc = "In Stock"
        if r.quantity <= 0:
            status_calc = "Out of Stock"
        elif r.quantity <= r.min_stock:
            status_calc = "Low Stock"
        elif r.quantity > r.max_stock:
            status_calc = "Overstock"

        result.append({
            "id": r.id,
            "warehouse_id": r.warehouse_id,
            "warehouse_name": r.warehouse_name,
            "product_id": r.product_id,
            "product_name": r.product_name,
            "product_sku": r.product_sku,
            "variant_id": r.variant_id,
            "quantity": r.quantity,
            "reserved_quantity": r.reserved_quantity,
            "available_quantity": r.quantity - r.reserved_quantity,
            "cost_price": r.cost_price,
            "selling_price": r.selling_price,
            "total_value": r.quantity * r.cost_price,
            "stock_status": status_calc
        })
    return result

@router.get("/movements", response_model=List[StockMovementResponse])
def list_stock_movements(
    product_id: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    movement_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    query = db.query(StockMovement).filter(StockMovement.organization_id == tenant.id)
    if product_id:
        query = query.filter(StockMovement.product_id == product_id)
    if warehouse_id:
        query = query.filter(StockMovement.warehouse_id == warehouse_id)
    if movement_type:
        query = query.filter(StockMovement.movement_type == movement_type)

    movements = query.order_by(StockMovement.created_at.desc()).limit(limit).all()

    res = []
    for m in movements:
        m_dict = StockMovementResponse.model_validate(m)
        if m.product:
            m_dict.product_name = m.product.name_en
            m_dict.product_sku = m.product.sku
        if m.warehouse:
            m_dict.warehouse_name = m.warehouse.name
        res.append(m_dict)
    return res

@router.post("/adjust", response_model=StockAdjustmentResponse)
def adjust_stock(
    data: StockAdjustmentCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == data.product_id, Product.organization_id == tenant.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    warehouse = db.query(Warehouse).filter(Warehouse.id == data.warehouse_id, Warehouse.organization_id == tenant.id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    # Get or create warehouse stock
    wh_stock = db.query(WarehouseStock).filter(
        WarehouseStock.warehouse_id == data.warehouse_id,
        WarehouseStock.product_id == data.product_id,
        WarehouseStock.variant_id == data.variant_id,
        WarehouseStock.organization_id == tenant.id
    ).first()

    previous_qty = wh_stock.quantity if wh_stock else 0.0
    new_qty = previous_qty + data.quantity_adjusted
    if new_qty < 0:
        raise HTTPException(status_code=400, detail="Cannot adjust stock below zero")

    if not wh_stock:
        wh_stock = WarehouseStock(
            organization_id=tenant.id,
            warehouse_id=data.warehouse_id,
            product_id=data.product_id,
            variant_id=data.variant_id,
            quantity=new_qty,
            reserved_quantity=0.0
        )
        db.add(wh_stock)
    else:
        wh_stock.quantity = new_qty

    adj_number = "ADJ-" + str(uuid.uuid4())[:8].upper()
    adjustment = StockAdjustment(
        organization_id=tenant.id,
        adjustment_number=adj_number,
        warehouse_id=data.warehouse_id,
        product_id=data.product_id,
        variant_id=data.variant_id,
        quantity_adjusted=data.quantity_adjusted,
        previous_quantity=previous_qty,
        new_quantity=new_qty,
        reason=data.reason,
        notes=data.notes,
        user_id=current_user.id
    )
    db.add(adjustment)

    # Auditable Stock Movement
    movement = StockMovement(
        organization_id=tenant.id,
        product_id=data.product_id,
        variant_id=data.variant_id,
        warehouse_id=data.warehouse_id,
        movement_type="Stock Adjustment",
        quantity=data.quantity_adjusted,
        previous_quantity=previous_qty,
        new_quantity=new_qty,
        reference_type="Adjustment",
        reference_id=adj_number,
        reason=data.reason,
        user_id=current_user.id
    )
    db.add(movement)

    log_audit_event(
        db,
        organization_id=tenant.id,
        action="ADJUST_STOCK",
        entity="StockAdjustment",
        entity_id=adj_number,
        user=current_user,
        old_value=f"Stock: {previous_qty}",
        new_value=f"Adjusted: {data.quantity_adjusted} -> New: {new_qty}, Reason: {data.reason}"
    )

    db.commit()
    db.refresh(adjustment)

    res = StockAdjustmentResponse.model_validate(adjustment)
    res.product_name = product.name_en
    res.warehouse_name = warehouse.name
    return res

@router.get("/transfers", response_model=List[StockTransferResponse])
def list_stock_transfers(
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    transfers = db.query(StockTransfer).filter(StockTransfer.organization_id == tenant.id).order_by(StockTransfer.created_at.desc()).all()
    res = []
    for t in transfers:
        td = StockTransferResponse.model_validate(t)
        if t.from_warehouse:
            td.from_warehouse_name = t.from_warehouse.name
        if t.to_warehouse:
            td.to_warehouse_name = t.to_warehouse.name
        res.append(td)
    return res

@router.post("/transfers", response_model=StockTransferResponse)
def create_stock_transfer(
    data: StockTransferCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    if data.from_warehouse_id == data.to_warehouse_id:
        raise HTTPException(status_code=400, detail="Source and destination warehouses cannot be identical")

    transfer_num = "TRF-" + str(uuid.uuid4())[:8].upper()
    transfer = StockTransfer(
        organization_id=tenant.id,
        transfer_number=transfer_num,
        from_warehouse_id=data.from_warehouse_id,
        to_warehouse_id=data.to_warehouse_id,
        status="Draft",
        notes=data.notes,
        created_by=current_user.id
    )
    db.add(transfer)
    db.flush()

    for item in data.items:
        t_item = StockTransferItem(
            organization_id=tenant.id,
            transfer_id=transfer.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity
        )
        db.add(t_item)

    db.commit()
    db.refresh(transfer)
    return transfer

@router.put("/transfers/{transfer_id}/status")
def update_stock_transfer_status(
    transfer_id: str,
    data: StockTransferStatusUpdate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    transfer = db.query(StockTransfer).filter(StockTransfer.id == transfer_id, StockTransfer.organization_id == tenant.id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Stock transfer not found")

    old_status = transfer.status
    new_status = data.status

    if old_status == "Received":
        raise HTTPException(status_code=400, detail="Completed transfers cannot be modified")

    # If transitioning to Received, execute atomic inventory transfer!
    if new_status == "Received":
        for item in transfer.items:
            # 1. Deduct from source warehouse
            from_stk = db.query(WarehouseStock).filter(
                WarehouseStock.warehouse_id == transfer.from_warehouse_id,
                WarehouseStock.product_id == item.product_id,
                WarehouseStock.variant_id == item.variant_id,
                WarehouseStock.organization_id == tenant.id
            ).first()

            from_prev = from_stk.quantity if from_stk else 0.0
            if from_prev < item.quantity:
                p = db.query(Product).filter(Product.id == item.product_id).first()
                p_name = p.name_en if p else item.product_id
                raise HTTPException(status_code=400, detail=f"Insufficient stock for '{p_name}' in source warehouse")

            from_stk.quantity -= item.quantity
            db.add(StockMovement(
                organization_id=tenant.id,
                product_id=item.product_id,
                variant_id=item.variant_id,
                warehouse_id=transfer.from_warehouse_id,
                movement_type="Stock Transfer",
                quantity=-item.quantity,
                previous_quantity=from_prev,
                new_quantity=from_stk.quantity,
                reference_type="TransferOut",
                reference_id=transfer.transfer_number,
                reason=f"Transfer to {transfer.to_warehouse.name if transfer.to_warehouse else 'WH'}",
                user_id=current_user.id
            ))

            # 2. Add to destination warehouse
            to_stk = db.query(WarehouseStock).filter(
                WarehouseStock.warehouse_id == transfer.to_warehouse_id,
                WarehouseStock.product_id == item.product_id,
                WarehouseStock.variant_id == item.variant_id,
                WarehouseStock.organization_id == tenant.id
            ).first()

            to_prev = to_stk.quantity if to_stk else 0.0
            if not to_stk:
                to_stk = WarehouseStock(
                    organization_id=tenant.id,
                    warehouse_id=transfer.to_warehouse_id,
                    product_id=item.product_id,
                    variant_id=item.variant_id,
                    quantity=item.quantity,
                    reserved_quantity=0.0
                )
                db.add(to_stk)
            else:
                to_stk.quantity += item.quantity

            db.add(StockMovement(
                organization_id=tenant.id,
                product_id=item.product_id,
                variant_id=item.variant_id,
                warehouse_id=transfer.to_warehouse_id,
                movement_type="Stock Transfer",
                quantity=item.quantity,
                previous_quantity=to_prev,
                new_quantity=to_prev + item.quantity,
                reference_type="TransferIn",
                reference_id=transfer.transfer_number,
                reason=f"Transfer from {transfer.from_warehouse.name if transfer.from_warehouse else 'WH'}",
                user_id=current_user.id
            ))

    transfer.status = new_status
    db.commit()
    return {"message": f"Transfer status updated to {new_status}"}
