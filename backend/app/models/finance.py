from sqlalchemy import Column, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import TenantModel

class ExpenseCategory(TenantModel):
    __tablename__ = "expense_categories"

    name_en = Column(String(100), nullable=False)
    name_kh = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)

    expenses = relationship("Expense", back_populates="category")

class Expense(TenantModel):
    __tablename__ = "expenses"

    expense_number = Column(String(50), nullable=False, index=True)
    category_id = Column(String(36), ForeignKey("expense_categories.id"), nullable=False)
    amount_usd = Column(Float, nullable=False)
    amount_khr = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    payment_method = Column(String(50), default="Cash")
    date = Column(DateTime, nullable=False)
    description = Column(Text, nullable=True)
    receipt_url = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)

    category = relationship("ExpenseCategory", back_populates="expenses")
    user = relationship("User")

class Payment(TenantModel):
    __tablename__ = "payments"

    payment_number = Column(String(50), nullable=False, index=True)
    reference_type = Column(String(50), nullable=False) # Sale, Purchase, Expense, CustomerPayment, SupplierPayment
    reference_id = Column(String(100), nullable=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=True)
    supplier_id = Column(String(36), ForeignKey("suppliers.id"), nullable=True)

    amount_usd = Column(Float, default=0.0, nullable=False)
    amount_khr = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="USD")
    payment_method = Column(String(50), default="Cash") # Cash, KHQR, Bank Transfer, Card, Other
    payment_provider_ref = Column(String(255), nullable=True) # e.g. Bakong / KHQR MD5 / transaction hash
    status = Column(String(50), default="Completed") # Completed, Pending, Failed
    payment_date = Column(DateTime, nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)

    customer = relationship("Customer")
    supplier = relationship("Supplier")
    user = relationship("User")
