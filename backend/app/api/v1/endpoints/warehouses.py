from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.warehouse import Warehouse, WarehouseStock
from app.models.organization import Organization
from app.models.user import User
from app.schemas.warehouse import WarehouseResponse, WarehouseCreate, WarehouseUpdate
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles
from app.services.plan_limit_service import check_plan_limit
from app.services.audit_service import log_audit_event

router = APIRouter()

@router.get("", response_model=List[WarehouseResponse])
def list_warehouses(
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    return db.query(Warehouse).filter(Warehouse.organization_id == tenant.id).all()

@router.post("", response_model=WarehouseResponse)
def create_warehouse(
    data: WarehouseCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    check_plan_limit(db, tenant.id, "warehouses")

    # Check unique code within tenant
    existing = db.query(Warehouse).filter(Warehouse.organization_id == tenant.id, Warehouse.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Warehouse code already exists in your organization")

    warehouse = Warehouse(
        organization_id=tenant.id,
        name=data.name,
        code=data.code,
        address=data.address,
        province=data.province,
        phone=data.phone,
        manager_name=data.manager_name,
        is_default=data.is_default,
        status=data.status
    )
    db.add(warehouse)
    log_audit_event(
        db,
        organization_id=tenant.id,
        action="CREATE_WAREHOUSE",
        entity="Warehouse",
        user=current_user,
        new_value=f"Created warehouse {data.name} ({data.code})"
    )
    db.commit()
    db.refresh(warehouse)
    return warehouse

@router.get("/{warehouse_id}", response_model=WarehouseResponse)
def get_warehouse(
    warehouse_id: str,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id, Warehouse.organization_id == tenant.id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return warehouse

@router.put("/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(
    warehouse_id: str,
    data: WarehouseUpdate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id, Warehouse.organization_id == tenant.id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(warehouse, key, value)

    log_audit_event(
        db,
        organization_id=tenant.id,
        action="UPDATE_WAREHOUSE",
        entity="Warehouse",
        entity_id=warehouse.id,
        user=current_user,
        new_value=f"Updated warehouse {warehouse.name}"
    )
    db.commit()
    db.refresh(warehouse)
    return warehouse

@router.delete("/{warehouse_id}")
def delete_warehouse(
    warehouse_id: str,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin"])),
    db: Session = Depends(get_db)
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id, Warehouse.organization_id == tenant.id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    warehouse.status = "inactive"
    db.commit()
    return {"message": "Warehouse deactivated successfully"}
