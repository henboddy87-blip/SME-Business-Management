from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.partner import Supplier
from app.models.purchase import Purchase
from app.models.organization import Organization
from app.models.user import User
from app.schemas.partner import SupplierResponse, SupplierCreate, SupplierUpdate
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles
from app.services.audit_service import log_audit_event

router = APIRouter()

@router.get("", response_model=List[SupplierResponse])
def list_suppliers(
    search: Optional[str] = None,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    query = db.query(Supplier).filter(Supplier.organization_id == tenant.id)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter((Supplier.name.ilike(search_fmt)) | (Supplier.phone.ilike(search_fmt)))

    suppliers = query.order_by(Supplier.created_at.desc()).all()
    res = []
    for s in suppliers:
        sd = SupplierResponse.model_validate(s)
        purchases_stats = db.query(
            func.count(Purchase.id).label("count"),
            func.coalesce(func.sum(Purchase.total), 0.0).label("spent")
        ).filter(Purchase.supplier_id == s.id, Purchase.organization_id == tenant.id).first()

        sd.total_purchases_count = purchases_stats.count or 0
        sd.total_spent_usd = float(purchases_stats.spent or 0.0)
        res.append(sd)
    return res

@router.post("", response_model=SupplierResponse)
def create_supplier(
    data: SupplierCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    supplier = Supplier(
        organization_id=tenant.id,
        name=data.name,
        contact_person=data.contact_person,
        phone=data.phone,
        email=data.email,
        address=data.address,
        province=data.province,
        payment_terms=data.payment_terms,
        status=data.status,
        notes=data.notes
    )
    db.add(supplier)
    log_audit_event(
        db,
        organization_id=tenant.id,
        action="CREATE_SUPPLIER",
        entity="Supplier",
        user=current_user,
        new_value=f"Created supplier {supplier.name}"
    )
    db.commit()
    db.refresh(supplier)
    return SupplierResponse.model_validate(supplier)

@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: str,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.organization_id == tenant.id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    sd = SupplierResponse.model_validate(supplier)
    purchases_stats = db.query(
        func.count(Purchase.id).label("count"),
        func.coalesce(func.sum(Purchase.total), 0.0).label("spent")
    ).filter(Purchase.supplier_id == supplier.id, Purchase.organization_id == tenant.id).first()

    sd.total_purchases_count = purchases_stats.count or 0
    sd.total_spent_usd = float(purchases_stats.spent or 0.0)
    return sd

@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: str,
    data: SupplierUpdate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.organization_id == tenant.id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(supplier, key, value)

    log_audit_event(
        db,
        organization_id=tenant.id,
        action="UPDATE_SUPPLIER",
        entity="Supplier",
        entity_id=supplier.id,
        user=current_user,
        new_value=f"Updated supplier {supplier.name}"
    )
    db.commit()
    db.refresh(supplier)
    return SupplierResponse.model_validate(supplier)

@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: str,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin"])),
    db: Session = Depends(get_db)
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.organization_id == tenant.id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    supplier.status = "inactive"
    db.commit()
    return {"message": "Supplier deactivated successfully"}
