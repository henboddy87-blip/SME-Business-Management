from sqlalchemy import Column, String, Float, Text, ForeignKey, UniqueConstraint, Integer
from sqlalchemy.orm import relationship
from app.models.base import TenantModel

class Category(TenantModel):
    __tablename__ = "categories"

    name_en = Column(String(100), nullable=False)
    name_kh = Column(String(100), nullable=True)
    parent_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active")

    parent = relationship("Category", remote_side="Category.id", backref="children")
    products = relationship("Product", back_populates="category")

class Brand(TenantModel):
    __tablename__ = "brands"

    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    products = relationship("Product", back_populates="brand")

class Unit(TenantModel):
    __tablename__ = "units"

    name_en = Column(String(50), nullable=False)
    name_kh = Column(String(50), nullable=True)
    short_code = Column(String(20), nullable=False)

    products = relationship("Product", back_populates="unit")

class Product(TenantModel):
    __tablename__ = "products"

    sku = Column(String(100), nullable=False, index=True)
    barcode = Column(String(100), nullable=True, index=True)
    name_en = Column(String(255), nullable=False)
    name_kh = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)

    category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    brand_id = Column(String(36), ForeignKey("brands.id", ondelete="SET NULL"), nullable=True)
    unit_id = Column(String(36), ForeignKey("units.id", ondelete="SET NULL"), nullable=True)
    supplier_id = Column(String(36), ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)

    cost_price = Column(Float, default=0.0, nullable=False)
    selling_price = Column(Float, default=0.0, nullable=False)
    min_stock = Column(Float, default=5.0)
    max_stock = Column(Float, default=100.0)
    image_url = Column(Text, nullable=True)
    status = Column(String(50), default="active", index=True)

    # Relationships
    category = relationship("Category", back_populates="products")
    brand = relationship("Brand", back_populates="products")
    unit = relationship("Unit", back_populates="products")
    supplier = relationship("Supplier", back_populates="products")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    warehouse_stocks = relationship("WarehouseStock", back_populates="product", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('organization_id', 'sku', name='uq_org_product_sku'),
    )

class ProductVariant(TenantModel):
    __tablename__ = "product_variants"

    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    sku = Column(String(100), nullable=False, index=True)
    barcode = Column(String(100), nullable=True, index=True)
    variant_name = Column(String(100), nullable=False) # e.g. "Medium / Black"
    size = Column(String(50), nullable=True)
    color = Column(String(50), nullable=True)
    cost_price = Column(Float, nullable=True)
    selling_price = Column(Float, nullable=True)
    status = Column(String(50), default="active")

    product = relationship("Product", back_populates="variants")
    warehouse_stocks = relationship("WarehouseStock", back_populates="variant", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('organization_id', 'sku', name='uq_org_variant_sku'),
    )
