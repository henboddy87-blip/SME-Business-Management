from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class PurchaseOrderItemCreate(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: float
    unit_cost: float

class PurchaseOrderItemResponse(BaseModel):
    id: str
    product_id: str
    variant_id: Optional[str] = None
    product_name: Optional[str] = None
    quantity: float
    received_quantity: float
    unit_cost: float
    subtotal: float

    class Config:
        from_attributes = True

class PurchaseOrderCreate(BaseModel):
    supplier_id: str
    warehouse_id: str
    discount: float = 0.0
    tax: float = 0.0
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderResponse(BaseModel):
    id: str
    po_number: str
    supplier_id: str
    supplier_name: Optional[str] = None
    warehouse_id: str
    warehouse_name: Optional[str] = None
    status: str
    subtotal: float
    discount: float
    tax: float
    total: float
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    items: List[PurchaseOrderItemResponse] = []

    class Config:
        from_attributes = True

class PurchaseItemCreate(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: float
    unit_cost: float

class PurchaseItemResponse(BaseModel):
    id: str
    product_id: str
    variant_id: Optional[str] = None
    product_name: Optional[str] = None
    quantity: float
    unit_cost: float
    subtotal: float

    class Config:
        from_attributes = True

class PurchaseCreate(BaseModel):
    po_id: Optional[str] = None
    supplier_id: str
    warehouse_id: str
    discount: float = 0.0
    tax: float = 0.0
    paid_amount: float = 0.0
    payment_method: str = "Cash"
    notes: Optional[str] = None
    items: List[PurchaseItemCreate]

class PurchaseResponse(BaseModel):
    id: str
    purchase_number: str
    po_id: Optional[str] = None
    supplier_id: str
    supplier_name: Optional[str] = None
    warehouse_id: str
    warehouse_name: Optional[str] = None
    status: str
    subtotal: float
    discount: float
    tax: float
    total: float
    paid_amount: float
    payment_status: str
    payment_method: str
    notes: Optional[str] = None
    created_at: datetime
    items: List[PurchaseItemResponse] = []

    class Config:
        from_attributes = True

class PurchaseReturnItemCreate(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: float
    unit_cost: float

class PurchaseReturnCreate(BaseModel):
    purchase_id: str
    reason: Optional[str] = None
    items: List[PurchaseReturnItemCreate]

class PurchaseReturnResponse(BaseModel):
    id: str
    return_number: str
    purchase_id: str
    supplier_id: str
    total_refund: float
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
