from sqlalchemy import Column, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import TenantModel

class Invoice(TenantModel):
    __tablename__ = "invoices"

    invoice_number = Column(String(50), nullable=False, index=True)
    sale_id = Column(String(36), ForeignKey("sales.id"), nullable=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=True)
    issue_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=True)
    subtotal = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    status = Column(String(50), default="Issued") # Draft, Issued, Paid, Overdue, Cancelled
    notes = Column(Text, nullable=True)

    sale = relationship("Sale")
    customer = relationship("Customer")
