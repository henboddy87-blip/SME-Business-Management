from typing import Optional, List
from pydantic import BaseModel, computed_field
from datetime import datetime

class SaleItemCreate(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: float
    unit_price: float
    discount: float = 0.0

class SaleItemResponse(BaseModel):
    id: str
    product_id: str
    variant_id: Optional[str] = None
    product_name: str
    sku: str
    quantity: float
    unit_price: float
    unit_cost: float
    discount: float
    subtotal: float

    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    customer_id: Optional[str] = None
    warehouse_id: str
    discount_rate: float = 0.0
    discount_amount: float = 0.0
    tax_rate: float = 0.0
    currency: str = "USD" # USD or KHR
    exchange_rate: float = 4100.0
    payment_method: str = "Cash" # Cash, KHQR, Bank Transfer, Card, Other
    paid_amount: float = 0.0
    notes: Optional[str] = None
    items: List[SaleItemCreate]

class SaleResponse(BaseModel):
    id: str
    invoice_number: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    warehouse_id: str
    warehouse_name: Optional[str] = None
    salesperson_id: str
    salesperson_name: Optional[str] = None
    subtotal: float
    discount_rate: float
    discount_amount: float
    tax_rate: float
    tax_amount: float
    total_amount_usd: float
    total_amount_khr: float
    currency: str
    exchange_rate: float
    payment_method: str
    payment_status: str
    paid_amount_usd: float
    change_amount_usd: float
    status: str
    notes: Optional[str] = None
    created_at: datetime
    items: List[SaleItemResponse] = []

    @computed_field
    @property
    def total_amount(self) -> float:
        return self.total_amount_usd

    @computed_field
    @property
    def paid_amount(self) -> float:
        return self.paid_amount_usd

    class Config:
        from_attributes = True

class SalesReturnItemCreate(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: float
    unit_price: float

class SalesReturnCreate(BaseModel):
    sale_id: str
    reason: Optional[str] = None
    items: List[SalesReturnItemCreate]

class SalesReturnResponse(BaseModel):
    id: str
    return_number: str
    sale_id: str
    customer_id: Optional[str] = None
    total_refund_usd: float
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class KHQRPaymentGenerateRequest(BaseModel):
    amount: float
    currency: str = "USD"
    invoice_number: Optional[str] = None

class KHQRPaymentGenerateResponse(BaseModel):
    qr_code_string: str
    md5_hash: str
    currency: str
    amount: float
    merchant_name: str
    merchant_city: str
    merchant_id: str
