from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class StockMovementResponse(BaseModel):
    id: str
    product_id: str
    variant_id: Optional[str] = None
    warehouse_id: str
    movement_type: str
    quantity: float
    previous_quantity: float
    new_quantity: float
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    reason: Optional[str] = None
    user_id: Optional[str] = None
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    warehouse_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class StockAdjustmentCreate(BaseModel):
    warehouse_id: str
    product_id: str
    variant_id: Optional[str] = None
    quantity_adjusted: float # e.g. -3 or +5
    reason: str
    notes: Optional[str] = None

class StockAdjustmentResponse(BaseModel):
    id: str
    adjustment_number: str
    warehouse_id: str
    product_id: str
    variant_id: Optional[str] = None
    quantity_adjusted: float
    previous_quantity: float
    new_quantity: float
    reason: str
    notes: Optional[str] = None
    created_at: datetime
    product_name: Optional[str] = None
    warehouse_name: Optional[str] = None

    class Config:
        from_attributes = True

class StockTransferItemCreate(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: float

class StockTransferItemResponse(BaseModel):
    id: str
    product_id: str
    variant_id: Optional[str] = None
    quantity: float
    product_name: Optional[str] = None

    class Config:
        from_attributes = True

class StockTransferCreate(BaseModel):
    from_warehouse_id: str
    to_warehouse_id: str
    notes: Optional[str] = None
    items: List[StockTransferItemCreate]

class StockTransferStatusUpdate(BaseModel):
    status: str # Draft, Requested, Approved, In Transit, Received, Cancelled

class StockTransferResponse(BaseModel):
    id: str
    transfer_number: str
    from_warehouse_id: str
    to_warehouse_id: str
    from_warehouse_name: Optional[str] = None
    to_warehouse_name: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    items: List[StockTransferItemResponse] = []

    class Config:
        from_attributes = True
