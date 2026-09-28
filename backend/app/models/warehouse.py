from sqlalchemy import Column, String, Boolean, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import TenantModel

class Warehouse(TenantModel):
    __tablename__ = "warehouses"

    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, index=True)
    address = Column(String(255), nullable=True)
    province = Column(String(100), default="Phnom Penh")
    phone = Column(String(50), nullable=True)
    manager_name = Column(String(100), nullable=True)
    is_default = Column(Boolean, default=False)
    status = Column(String(50), default="active") # active, inactive

    stocks = relationship("WarehouseStock", back_populates="warehouse", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('organization_id', 'code', name='uq_org_warehouse_code'),
    )

class WarehouseStock(TenantModel):
    __tablename__ = "warehouse_stocks"

    warehouse_id = Column(String(36), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_id = Column(String(36), ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=True, index=True)
    quantity = Column(Float, default=0.0, nullable=False)
    reserved_quantity = Column(Float, default=0.0, nullable=False)

    warehouse = relationship("Warehouse", back_populates="stocks")
    product = relationship("Product", back_populates="warehouse_stocks")
    variant = relationship("ProductVariant", back_populates="warehouse_stocks")

    __table_args__ = (
        UniqueConstraint('warehouse_id', 'product_id', 'variant_id', name='uq_warehouse_product_variant'),
    )
