from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.partner import Customer
from app.models.sale import Sale
from app.models.organization import Organization
from app.models.user import User
from app.schemas.partner import CustomerResponse, CustomerCreate, CustomerUpdate
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles
from app.services.audit_service import log_audit_event

router = APIRouter()

@router.get("", response_model=List[CustomerResponse])
def list_customers(
    search: Optional[str] = None,
    customer_type: Optional[str] = None,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    query = db.query(Customer).filter(Customer.organization_id == tenant.id)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter((Customer.name.ilike(search_fmt)) | (Customer.phone.ilike(search_fmt)))
    if customer_type:
        query = query.filter(Customer.customer_type == customer_type)

    customers = query.order_by(Customer.created_at.desc()).all()
    res = []
    for c in customers:
        cd = CustomerResponse.model_validate(c)
        sales_stats = db.query(
            func.count(Sale.id).label("count"),
            func.coalesce(func.sum(Sale.total_amount_usd), 0.0).label("spent")
        ).filter(Sale.customer_id == c.id, Sale.organization_id == tenant.id).first()

        cd.total_sales_count = sales_stats.count or 0
        cd.total_spent_usd = float(sales_stats.spent or 0.0)
        res.append(cd)
    return res

@router.post("", response_model=CustomerResponse)
def create_customer(
    data: CustomerCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Sales Staff"])),
    db: Session = Depends(get_db)
):
    customer = Customer(
        organization_id=tenant.id,
        name=data.name,
        phone=data.phone,
        email=data.email,
        address=data.address,
        province=data.province,
        customer_type=data.customer_type,
        credit_limit=data.credit_limit,
        status=data.status,
        notes=data.notes
    )
    db.add(customer)
    log_audit_event(
        db,
        organization_id=tenant.id,
        action="CREATE_CUSTOMER",
        entity="Customer",
        user=current_user,
        new_value=f"Created customer {customer.name} ({customer.phone})"
    )
    db.commit()
    db.refresh(customer)
    return CustomerResponse.model_validate(customer)

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: str,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.organization_id == tenant.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    cd = CustomerResponse.model_validate(customer)
    sales_stats = db.query(
        func.count(Sale.id).label("count"),
        func.coalesce(func.sum(Sale.total_amount_usd), 0.0).label("spent")
    ).filter(Sale.customer_id == customer.id, Sale.organization_id == tenant.id).first()

    cd.total_sales_count = sales_stats.count or 0
    cd.total_spent_usd = float(sales_stats.spent or 0.0)
    return cd

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: str,
    data: CustomerUpdate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Sales Staff"])),
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.organization_id == tenant.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(customer, key, value)

    log_audit_event(
        db,
        organization_id=tenant.id,
        action="UPDATE_CUSTOMER",
        entity="Customer",
        entity_id=customer.id,
        user=current_user,
        new_value=f"Updated customer {customer.name}"
    )
    db.commit()
    db.refresh(customer)
    return CustomerResponse.model_validate(customer)

@router.delete("/{customer_id}")
def delete_customer(
    customer_id: str,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin"])),
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.organization_id == tenant.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer.status = "inactive"
    db.commit()
    return {"message": "Customer deactivated successfully"}
