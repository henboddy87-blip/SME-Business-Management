from sqlalchemy import Column, String, Float, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import TenantModel

class Customer(TenantModel):
    __tablename__ = "customers"

    name = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True, index=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    province = Column(String(100), default="Phnom Penh")
    customer_type = Column(String(50), default="Retail") # Retail, Wholesale, VIP
    credit_limit = Column(Float, default=0.0)
    outstanding_balance = Column(Float, default=0.0)
    status = Column(String(50), default="active")
    notes = Column(Text, nullable=True)

    sales = relationship("Sale", back_populates="customer")

class Supplier(TenantModel):
    __tablename__ = "suppliers"

    name = Column(String(255), nullable=False, index=True)
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True, index=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    province = Column(String(100), default="Phnom Penh")
    payment_terms = Column(String(100), default="Net 30")
    outstanding_balance = Column(Float, default=0.0)
    status = Column(String(50), default="active")
    notes = Column(Text, nullable=True)

    products = relationship("Product", back_populates="supplier")
    purchases = relationship("Purchase", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")
