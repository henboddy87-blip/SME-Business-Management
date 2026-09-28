from sqlalchemy import Column, String, Text, Boolean, ForeignKey
from app.models.base import TenantModel

class Notification(TenantModel):
    __tablename__ = "notifications"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="system") # low_stock, out_of_stock, new_sale, purchase_order, leave_request, alert
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    link = Column(String(255), nullable=True)
