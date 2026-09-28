from sqlalchemy import Column, String, Text, ForeignKey
from app.models.base import TenantModel

class AuditLog(TenantModel):
    __tablename__ = "audit_logs"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False, index=True) # CREATE, UPDATE, DELETE, ADJUST_STOCK, etc.
    entity = Column(String(100), nullable=False, index=True) # Product, Sale, Purchase, etc.
    entity_id = Column(String(100), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
