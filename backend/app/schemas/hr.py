from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import date, datetime

class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None

class DepartmentResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class PositionCreate(BaseModel):
    department_id: Optional[str] = None
    title: str
    base_salary: float = 0.0

class PositionResponse(BaseModel):
    id: str
    department_id: Optional[str] = None
    title: str
    base_salary: float

    class Config:
        from_attributes = True

class EmployeeCreate(BaseModel):
    employee_code: str
    first_name: str
    last_name: str
    gender: str = "Male"
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    province: str = "Phnom Penh"
    department_id: Optional[str] = None
    position_id: Optional[str] = None
    hire_date: Optional[date] = None
    salary: float = 0.0
    emergency_contact: Optional[str] = None

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    province: Optional[str] = None
    department_id: Optional[str] = None
    position_id: Optional[str] = None
    salary: Optional[float] = None
    status: Optional[str] = None
    emergency_contact: Optional[str] = None

class EmployeeResponse(BaseModel):
    id: str
    employee_code: str
    first_name: str
    last_name: str
    full_name: Optional[str] = None
    gender: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    province: str
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    position_id: Optional[str] = None
    position_title: Optional[str] = None
    hire_date: Optional[date] = None
    salary: float
    status: str
    emergency_contact: Optional[str] = None

    class Config:
        from_attributes = True

class AttendanceCreate(BaseModel):
    employee_id: str
    date: date
    check_in: Optional[str] = "08:00 AM"
    check_out: Optional[str] = "05:00 PM"
    status: str = "Present" # Present, Late, Absent, Leave
    notes: Optional[str] = None

class AttendanceResponse(BaseModel):
    id: str
    employee_id: str
    employee_name: Optional[str] = None
    date: date
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    status: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class LeaveRequestCreate(BaseModel):
    employee_id: str
    leave_type: str # Annual Leave, Sick Leave, Personal Leave, Other
    start_date: date
    end_date: date
    days_count: float = 1.0
    reason: Optional[str] = None

class LeaveStatusUpdate(BaseModel):
    status: str # Approved, Rejected

class LeaveRequestResponse(BaseModel):
    id: str
    employee_id: str
    employee_name: Optional[str] = None
    leave_type: str
    start_date: date
    end_date: date
    days_count: float
    reason: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class PayrollPreviewItem(BaseModel):
    employee_id: str
    employee_code: str
    employee_name: str
    position_title: Optional[str] = None
    base_salary: float
    allowance: float = 0.0
    bonus: float = 0.0
    deduction: float = 0.0
    days_worked: int = 26
    net_salary: float
