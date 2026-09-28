from sqlalchemy import Column, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import TenantModel

class Quotation(TenantModel):
    __tablename__ = "quotations"

    quotation_number = Column(String(50), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    subtotal = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    valid_until = Column(DateTime, nullable=True)
    status = Column(String(50), default="Draft") # Draft, Sent, Accepted, Rejected, Expired, Converted
    notes = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)

    customer = relationship("Customer")
    user = relationship("User")
    items = relationship("QuotationItem", back_populates="quotation", cascade="all, delete-orphan")

class QuotationItem(TenantModel):
    __tablename__ = "quotation_items"

    quotation_id = Column(String(36), ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    variant_id = Column(String(36), ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    subtotal = Column(Float, nullable=False)

    quotation = relationship("Quotation", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")
