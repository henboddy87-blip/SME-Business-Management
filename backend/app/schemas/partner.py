from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class CustomerBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    province: str = "Phnom Penh"
    customer_type: str = "Retail"
    credit_limit: float = 0.0
    status: str = "active"
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    province: Optional[str] = None
    customer_type: Optional[str] = None
    credit_limit: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: str
    organization_id: str
    outstanding_balance: float = 0.0
    total_sales_count: int = 0
    total_spent_usd: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True

class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    province: str = "Phnom Penh"
    payment_terms: str = "Net 30"
    status: str = "active"
    notes: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    province: Optional[str] = None
    payment_terms: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class SupplierResponse(SupplierBase):
    id: str
    organization_id: str
    outstanding_balance: float = 0.0
    total_purchases_count: int = 0
    total_spent_usd: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True
