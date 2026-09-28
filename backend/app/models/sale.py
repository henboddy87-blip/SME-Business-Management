from sqlalchemy import Column, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import TenantModel

class Sale(TenantModel):
    __tablename__ = "sales"

    invoice_number = Column(String(50), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=True)
    warehouse_id = Column(String(36), ForeignKey("warehouses.id"), nullable=False)
    salesperson_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    subtotal = Column(Float, default=0.0, nullable=False)
    discount_rate = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    tax_rate = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    
    total_amount_usd = Column(Float, default=0.0, nullable=False)
    total_amount_khr = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="USD")
    exchange_rate = Column(Float, default=4100.0)

    payment_method = Column(String(50), default="Cash") # Cash, KHQR, Bank Transfer, Card, Other
    payment_status = Column(String(50), default="Paid") # Paid, Partial, Unpaid
    paid_amount_usd = Column(Float, default=0.0)
    change_amount_usd = Column(Float, default=0.0)
    status = Column(String(50), default="Completed") # Completed, Returned, Cancelled
    notes = Column(Text, nullable=True)

    # Relationships
    customer = relationship("Customer", back_populates="sales")
    warehouse = relationship("Warehouse")
    salesperson = relationship("User")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
    returns = relationship("SalesReturn", back_populates="sale")

class SaleItem(TenantModel):
    __tablename__ = "sale_items"

    sale_id = Column(String(36), ForeignKey("sales.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    variant_id = Column(String(36), ForeignKey("product_variants.id"), nullable=True)
    product_name = Column(String(255), nullable=False)
    sku = Column(String(100), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    unit_cost = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    subtotal = Column(Float, nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")

class SalesReturn(TenantModel):
    __tablename__ = "sales_returns"

    return_number = Column(String(50), nullable=False, index=True)
    sale_id = Column(String(36), ForeignKey("sales.id"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=True)
    total_refund_usd = Column(Float, default=0.0)
    reason = Column(String(255), nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)

    sale = relationship("Sale", back_populates="returns")
    customer = relationship("Customer")
    user = relationship("User")
    items = relationship("SalesReturnItem", back_populates="sales_return", cascade="all, delete-orphan")

class SalesReturnItem(TenantModel):
    __tablename__ = "sales_return_items"

    sales_return_id = Column(String(36), ForeignKey("sales_returns.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    variant_id = Column(String(36), ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    refund_amount = Column(Float, nullable=False)

    sales_return = relationship("SalesReturn", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")
