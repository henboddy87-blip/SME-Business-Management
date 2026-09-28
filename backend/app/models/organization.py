from sqlalchemy import Column, String, Boolean, Float, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Organization(BaseModel):
    __tablename__ = "organizations"

    name = Column(String(255), nullable=False, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    business_type = Column(String(100), default="Retail")
    owner_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    province = Column(String(100), default="Phnom Penh")
    district = Column(String(100), nullable=True)
    logo_url = Column(Text, nullable=True)
    currency = Column(String(10), default="USD")
    is_active = Column(Boolean, default=True, nullable=False)
    onboarding_completed = Column(Boolean, default=False, nullable=False)

    # Relationships
    settings = relationship("OrganizationSettings", back_populates="organization", uselist=False, cascade="all, delete-orphan")
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="organization", uselist=False, cascade="all, delete-orphan")

class OrganizationSettings(BaseModel):
    __tablename__ = "organization_settings"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    tax_number = Column(String(100), nullable=True)
    default_tax_rate = Column(Float, default=10.0) # 10% standard VAT in Cambodia
    tax_enabled = Column(Boolean, default=True)
    invoice_prefix = Column(String(20), default="INV-")
    quotation_prefix = Column(String(20), default="QUO-")
    po_prefix = Column(String(20), default="PO-")
    invoice_footer_en = Column(Text, default="Thank you for your business!")
    invoice_footer_kh = Column(Text, default="សូមអរគុណចំពោះការគាំទ្ររបស់លោកអ្នក!")
    khr_exchange_rate = Column(Float, default=4100.0)
    enable_khqr = Column(Boolean, default=True)
    khqr_merchant_name = Column(String(255), nullable=True)
    khqr_merchant_city = Column(String(100), default="Phnom Penh")
    khqr_merchant_id = Column(String(100), nullable=True)
    telegram_bot_token = Column(String(255), nullable=True)
    telegram_chat_id = Column(String(100), nullable=True)
    telegram_notifications_enabled = Column(Boolean, default=False)
    default_warehouse_id = Column(String(36), nullable=True)

    organization = relationship("Organization", back_populates="settings")
