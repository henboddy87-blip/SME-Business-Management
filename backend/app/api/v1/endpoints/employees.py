from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.hr import Department, Position, Employee
from app.models.organization import Organization
from app.models.user import User
from app.schemas.hr import (
    DepartmentResponse, DepartmentCreate,
    PositionResponse, PositionCreate,
    EmployeeResponse, EmployeeCreate, EmployeeUpdate
)
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles
from app.services.audit_service import log_audit_event

router = APIRouter()

# Departments
@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments(tenant: Organization = Depends(get_current_tenant), db: Session = Depends(get_db)):
    return db.query(Department).filter(Department.organization_id == tenant.id).all()

@router.post("/departments", response_model=DepartmentResponse)
def create_department(
    data: DepartmentCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "HR Staff"])),
    db: Session = Depends(get_db)
):
    dept = Department(organization_id=tenant.id, name=data.name, description=data.description)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

# Positions
@router.get("/positions", response_model=List[PositionResponse])
def list_positions(tenant: Organization = Depends(get_current_tenant), db: Session = Depends(get_db)):
    return db.query(Position).filter(Position.organization_id == tenant.id).all()

@router.post("/positions", response_model=PositionResponse)
def create_position(
    data: PositionCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "HR Staff"])),
    db: Session = Depends(get_db)
):
    pos = Position(
        organization_id=tenant.id,
        department_id=data.department_id,
        title=data.title,
        base_salary=data.base_salary
    )
    db.add(pos)
    db.commit()
    db.refresh(pos)
    return pos

# Employees
@router.get("", response_model=List[EmployeeResponse])
def list_employees(tenant: Organization = Depends(get_current_tenant), db: Session = Depends(get_db)):
    employees = db.query(Employee).filter(Employee.organization_id == tenant.id).all()
    res = []
    for emp in employees:
        ed = EmployeeResponse.model_validate(emp)
        ed.full_name = f"{emp.first_name} {emp.last_name}"
        if emp.department:
            ed.department_name = emp.department.name
        if emp.position:
            ed.position_title = emp.position.title
        res.append(ed)
    return res

@router.post("", response_model=EmployeeResponse)
def create_employee(
    data: EmployeeCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "HR Staff"])),
    db: Session = Depends(get_db)
):
    existing = db.query(Employee).filter(Employee.organization_id == tenant.id, Employee.employee_code == data.employee_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee code already exists in your organization")

    emp = Employee(
        organization_id=tenant.id,
        employee_code=data.employee_code,
        first_name=data.first_name,
        last_name=data.last_name,
        gender=data.gender,
        phone=data.phone,
        email=data.email,
        address=data.address,
        province=data.province,
        department_id=data.department_id,
        position_id=data.position_id,
        hire_date=data.hire_date,
        salary=data.salary,
        emergency_contact=data.emergency_contact,
        status="Active"
    )
    db.add(emp)
    log_audit_event(
        db,
        organization_id=tenant.id,
        action="CREATE_EMPLOYEE",
        entity="Employee",
        entity_id=data.employee_code,
        user=current_user,
        new_value=f"Created employee {emp.first_name} {emp.last_name}"
    )
    db.commit()
    db.refresh(emp)

    ed = EmployeeResponse.model_validate(emp)
    ed.full_name = f"{emp.first_name} {emp.last_name}"
    if emp.department:
        ed.department_name = emp.department.name
    if emp.position:
        ed.position_title = emp.position.title
    return ed

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: str,
    data: EmployeeUpdate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "HR Staff"])),
    db: Session = Depends(get_db)
):
    emp = db.query(Employee).filter(Employee.id == employee_id, Employee.organization_id == tenant.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(emp, key, value)

    db.commit()
    db.refresh(emp)

    ed = EmployeeResponse.model_validate(emp)
    ed.full_name = f"{emp.first_name} {emp.last_name}"
    if emp.department:
        ed.department_name = emp.department.name
    if emp.position:
        ed.position_title = emp.position.title
    return ed
