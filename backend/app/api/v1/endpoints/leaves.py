from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.hr import LeaveRequest, Employee
from app.models.organization import Organization
from app.models.user import User
from app.schemas.hr import LeaveRequestResponse, LeaveRequestCreate, LeaveStatusUpdate
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles

router = APIRouter()

@router.get("", response_model=List[LeaveRequestResponse])
def list_leaves(tenant: Organization = Depends(get_current_tenant), db: Session = Depends(get_db)):
    leaves = db.query(LeaveRequest).filter(LeaveRequest.organization_id == tenant.id).order_by(LeaveRequest.created_at.desc()).all()
    res = []
    for l in leaves:
        ld = LeaveRequestResponse.model_validate(l)
        if l.employee:
            ld.employee_name = f"{l.employee.first_name} {l.employee.last_name}"
        res.append(ld)
    return res

@router.post("", response_model=LeaveRequestResponse)
def submit_leave_request(
    data: LeaveRequestCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "HR Staff"])),
    db: Session = Depends(get_db)
):
    leave = LeaveRequest(
        organization_id=tenant.id,
        employee_id=data.employee_id,
        leave_type=data.leave_type,
        start_date=data.start_date,
        end_date=data.end_date,
        days_count=data.days_count,
        reason=data.reason,
        status="Pending"
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)

    ld = LeaveRequestResponse.model_validate(leave)
    if leave.employee:
        ld.employee_name = f"{leave.employee.first_name} {leave.employee.last_name}"
    return ld

@router.put("/{leave_id}/status", response_model=LeaveRequestResponse)
def update_leave_status(
    leave_id: str,
    data: LeaveStatusUpdate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "HR Staff", "Manager"])),
    db: Session = Depends(get_db)
):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id, LeaveRequest.organization_id == tenant.id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    leave.status = data.status
    leave.approved_by = current_user.id
    db.commit()
    db.refresh(leave)

    ld = LeaveRequestResponse.model_validate(leave)
    if leave.employee:
        ld.employee_name = f"{leave.employee.first_name} {leave.employee.last_name}"
    return ld
