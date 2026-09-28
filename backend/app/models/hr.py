from sqlalchemy import Column, String, Float, Text, ForeignKey, DateTime, Date, Time
from sqlalchemy.orm import relationship
from app.models.base import TenantModel

class Department(TenantModel):
    __tablename__ = "departments"

    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    employees = relationship("Employee", back_populates="department")
    positions = relationship("Position", back_populates="department")

class Position(TenantModel):
    __tablename__ = "positions"

    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    title = Column(String(100), nullable=False)
    base_salary = Column(Float, default=0.0)

    department = relationship("Department", back_populates="positions")
    employees = relationship("Employee", back_populates="position")

class Employee(TenantModel):
    __tablename__ = "employees"

    employee_code = Column(String(50), nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    gender = Column(String(20), default="Male")
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    province = Column(String(100), default="Phnom Penh")

    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    position_id = Column(String(36), ForeignKey("positions.id"), nullable=True)
    hire_date = Column(Date, nullable=True)
    salary = Column(Float, default=0.0)
    status = Column(String(50), default="Active") # Active, On Leave, Terminated
    emergency_contact = Column(String(255), nullable=True)

    department = relationship("Department", back_populates="employees")
    position = relationship("Position", back_populates="employees")
    attendances = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    leaves = relationship("LeaveRequest", back_populates="employee", cascade="all, delete-orphan")

class Attendance(TenantModel):
    __tablename__ = "attendance"

    employee_id = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    check_in = Column(String(20), nullable=True) # e.g. "08:00 AM"
    check_out = Column(String(20), nullable=True) # e.g. "05:00 PM"
    status = Column(String(50), default="Present") # Present, Late, Absent, Leave
    notes = Column(Text, nullable=True)

    employee = relationship("Employee", back_populates="attendances")

class LeaveRequest(TenantModel):
    __tablename__ = "leave_requests"

    employee_id = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type = Column(String(50), nullable=False) # Annual Leave, Sick Leave, Personal Leave, Other
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days_count = Column(Float, default=1.0)
    reason = Column(Text, nullable=True)
    status = Column(String(50), default="Pending") # Pending, Approved, Rejected
    approved_by = Column(String(36), ForeignKey("users.id"), nullable=True)

    employee = relationship("Employee", back_populates="leaves")
    approver = relationship("User")
