from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class WarehouseBase(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    province: str = "Phnom Penh"
    phone: Optional[str] = None
    manager_name: Optional[str] = None
    is_default: bool = False
    status: str = "active"

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    province: Optional[str] = None
    phone: Optional[str] = None
    manager_name: Optional[str] = None
    is_default: Optional[bool] = None
    status: Optional[str] = None

class WarehouseResponse(WarehouseBase):
    id: str
    organization_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WarehouseStockResponse(BaseModel):
    id: str
    warehouse_id: str
    product_id: str
    variant_id: Optional[str] = None
    quantity: float
    reserved_quantity: float
    warehouse_name: Optional[str] = None

    class Config:
        from_attributes = True
