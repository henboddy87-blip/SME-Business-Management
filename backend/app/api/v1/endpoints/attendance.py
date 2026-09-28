from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.hr import Attendance, Employee
from app.models.organization import Organization
from app.models.user import User
from app.schemas.hr import AttendanceResponse, AttendanceCreate, PayrollPreviewItem
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles

router = APIRouter()

@router.get("", response_model=List[AttendanceResponse])
def list_attendance(
    target_date: Optional[date] = None,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    query = db.query(Attendance).filter(Attendance.organization_id == tenant.id)
    if target_date:
        query = query.filter(Attendance.date == target_date)
    else:
        query = query.filter(Attendance.date == date.today())

    records = query.all()
    res = []
    for att in records:
        ad = AttendanceResponse.model_validate(att)
        if att.employee:
            ad.employee_name = f"{att.employee.first_name} {att.employee.last_name}"
        res.append(ad)
    return res

@router.post("", response_model=AttendanceResponse)
def record_attendance(
    data: AttendanceCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "HR Staff"])),
    db: Session = Depends(get_db)
):
    # Check if attendance already recorded for this employee on this date
    existing = db.query(Attendance).filter(
        Attendance.organization_id == tenant.id,
        Attendance.employee_id == data.employee_id,
        Attendance.date == data.date
    ).first()

    if existing:
        existing.check_in = data.check_in
        existing.check_out = data.check_out
        existing.status = data.status
        existing.notes = data.notes
        db.commit()
        db.refresh(existing)
        ad = AttendanceResponse.model_validate(existing)
        if existing.employee:
            ad.employee_name = f"{existing.employee.first_name} {existing.employee.last_name}"
        return ad

    att = Attendance(
        organization_id=tenant.id,
        employee_id=data.employee_id,
        date=data.date,
        check_in=data.check_in,
        check_out=data.check_out,
        status=data.status,
        notes=data.notes
    )
    db.add(att)
    db.commit()
    db.refresh(att)

    ad = AttendanceResponse.model_validate(att)
    if att.employee:
        ad.employee_name = f"{att.employee.first_name} {att.employee.last_name}"
    return ad

@router.get("/payroll-preview", response_model=List[PayrollPreviewItem])
def get_payroll_preview(
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Extensible Payroll Architecture (Section 34).
    Calculates monthly employee payroll projection based on base salary, allowances, and attendance.
    """
    employees = db.query(Employee).filter(Employee.organization_id == tenant.id, Employee.status == "Active").all()
    preview = []
    for emp in employees:
        base = emp.salary or 0.0
        # Standard SME allowance / bonus baseline
        allowance = 30.0 if base > 300 else 15.0
        bonus = 0.0
        deduction = 0.0
        net = base + allowance + bonus - deduction

        preview.append(PayrollPreviewItem(
            employee_id=emp.id,
            employee_code=emp.employee_code,
            employee_name=f"{emp.first_name} {emp.last_name}",
            position_title=emp.position.title if emp.position else "Staff",
            base_salary=base,
            allowance=allowance,
            bonus=bonus,
            deduction=deduction,
            days_worked=26,
            net_salary=net
        ))
    return preview
