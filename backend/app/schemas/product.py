from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

# Category
class CategoryBase(BaseModel):
    name_en: str
    name_kh: Optional[str] = None
    parent_id: Optional[str] = None
    description: Optional[str] = None
    status: str = "active"

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name_en: Optional[str] = None
    name_kh: Optional[str] = None
    parent_id: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: str
    organization_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Brand
class BrandBase(BaseModel):
    name: str
    description: Optional[str] = None

class BrandCreate(BrandBase):
    pass

class BrandResponse(BrandBase):
    id: str
    organization_id: str

    class Config:
        from_attributes = True

# Unit
class UnitBase(BaseModel):
    name_en: str
    name_kh: Optional[str] = None
    short_code: str

class UnitCreate(UnitBase):
    pass

class UnitResponse(UnitBase):
    id: str
    organization_id: str

    class Config:
        from_attributes = True

# Variant
class ProductVariantBase(BaseModel):
    sku: str
    barcode: Optional[str] = None
    variant_name: str
    size: Optional[str] = None
    color: Optional[str] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    status: str = "active"

class ProductVariantCreate(ProductVariantBase):
    pass

class ProductVariantResponse(ProductVariantBase):
    id: str
    product_id: str
    organization_id: str

    class Config:
        from_attributes = True

# Product
class ProductBase(BaseModel):
    sku: str
    barcode: Optional[str] = None
    name_en: str
    name_kh: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    brand_id: Optional[str] = None
    unit_id: Optional[str] = None
    supplier_id: Optional[str] = None
    cost_price: float = 0.0
    selling_price: float = 0.0
    min_stock: float = 5.0
    max_stock: float = 100.0
    image_url: Optional[str] = None
    status: str = "active"

class ProductCreate(ProductBase):
    initial_stock: Optional[float] = 0.0
    initial_warehouse_id: Optional[str] = None
    variants: Optional[List[ProductVariantCreate]] = []

class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    barcode: Optional[str] = None
    name_en: Optional[str] = None
    name_kh: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    brand_id: Optional[str] = None
    unit_id: Optional[str] = None
    supplier_id: Optional[str] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    min_stock: Optional[float] = None
    max_stock: Optional[float] = None
    image_url: Optional[str] = None
    status: Optional[str] = None

class ProductResponse(ProductBase):
    id: str
    organization_id: str
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    brand: Optional[BrandResponse] = None
    unit: Optional[UnitResponse] = None
    variants: List[ProductVariantResponse] = []
    total_stock: float = 0.0
    stock_status: str = "In Stock" # In Stock, Low Stock, Out of Stock, Overstock

    class Config:
        from_attributes = True
