import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.quotation import Quotation, QuotationItem
from app.models.sale import Sale, SaleItem
from app.models.invoice import Invoice
from app.models.organization import Organization, OrganizationSettings
from app.models.user import User
from app.schemas.quotation import QuotationResponse, QuotationCreate, InvoiceResponse
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles
from app.services.audit_service import log_audit_event

router = APIRouter()

@router.get("", response_model=List[QuotationResponse])
def list_quotations(
    status_filter: Optional[str] = None,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    query = db.query(Quotation).filter(Quotation.organization_id == tenant.id)
    if status_filter:
        query = query.filter(Quotation.status == status_filter)
    quotations = query.order_by(Quotation.created_at.desc()).all()

    res = []
    for q in quotations:
        qd = QuotationResponse.model_validate(q)
        if q.customer:
            qd.customer_name = q.customer.name
        res.append(qd)
    return res

@router.post("", response_model=QuotationResponse)
def create_quotation(
    data: QuotationCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Sales Staff"])),
    db: Session = Depends(get_db)
):
    quo_number = "QUO-" + str(uuid.uuid4())[:8].upper()
    subtotal = sum((i.quantity * i.unit_price) - i.discount for i in data.items)
    total = subtotal + data.tax

    quotation = Quotation(
        organization_id=tenant.id,
        quotation_number=quo_number,
        customer_id=data.customer_id,
        subtotal=subtotal,
        discount=data.discount,
        tax=data.tax,
        total=total,
        valid_until=data.valid_until,
        status="Draft",
        notes=data.notes,
        created_by=current_user.id
    )
    db.add(quotation)
    db.flush()

    for item in data.items:
        qi = QuotationItem(
            organization_id=tenant.id,
            quotation_id=quotation.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount=item.discount,
            subtotal=(item.quantity * item.unit_price) - item.discount
        )
        db.add(qi)

    log_audit_event(
        db,
        organization_id=tenant.id,
        action="CREATE_QUOTATION",
        entity="Quotation",
        entity_id=quo_number,
        user=current_user,
        new_value=f"Created quotation {quo_number} total ${total:.2f}"
    )
    db.commit()
    db.refresh(quotation)
    return quotation

@router.put("/{quotation_id}/status")
def update_quotation_status(
    quotation_id: str,
    new_status: str,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Sales Staff"])),
    db: Session = Depends(get_db)
):
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id, Quotation.organization_id == tenant.id).first()
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    quotation.status = new_status
    db.commit()
    return {"message": f"Quotation status updated to {new_status}"}
