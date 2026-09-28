from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class QuotationItemCreate(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: float
    unit_price: float
    discount: float = 0.0

class QuotationItemResponse(BaseModel):
    id: str
    product_id: str
    variant_id: Optional[str] = None
    product_name: Optional[str] = None
    quantity: float
    unit_price: float
    discount: float
    subtotal: float

    class Config:
        from_attributes = True

class QuotationCreate(BaseModel):
    customer_id: str
    discount: float = 0.0
    tax: float = 0.0
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[QuotationItemCreate]

class QuotationResponse(BaseModel):
    id: str
    quotation_number: str
    customer_id: str
    customer_name: Optional[str] = None
    subtotal: float
    discount: float
    tax: float
    total: float
    valid_until: Optional[datetime] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    items: List[QuotationItemResponse] = []

    class Config:
        from_attributes = True

class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    sale_id: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    issue_date: datetime
    due_date: Optional[datetime] = None
    subtotal: float
    tax: float
    discount: float
    total: float
    paid_amount: float
    status: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True
