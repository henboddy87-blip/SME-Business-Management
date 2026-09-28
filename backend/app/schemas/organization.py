from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class OrganizationSettingsResponse(BaseModel):
    tax_number: Optional[str] = None
    default_tax_rate: float = 10.0
    tax_enabled: bool = True
    invoice_prefix: str = "INV-"
    quotation_prefix: str = "QUO-"
    po_prefix: str = "PO-"
    invoice_footer_en: Optional[str] = None
    invoice_footer_kh: Optional[str] = None
    khr_exchange_rate: float = 4100.0
    enable_khqr: bool = True
    khqr_merchant_name: Optional[str] = None
    khqr_merchant_city: Optional[str] = "Phnom Penh"
    khqr_merchant_id: Optional[str] = None
    telegram_notifications_enabled: bool = False
    default_warehouse_id: Optional[str] = None

    class Config:
        from_attributes = True

class OrganizationSettingsUpdate(BaseModel):
    tax_number: Optional[str] = None
    default_tax_rate: Optional[float] = None
    tax_enabled: Optional[bool] = None
    invoice_prefix: Optional[str] = None
    quotation_prefix: Optional[str] = None
    po_prefix: Optional[str] = None
    invoice_footer_en: Optional[str] = None
    invoice_footer_kh: Optional[str] = None
    khr_exchange_rate: Optional[float] = None
    enable_khqr: Optional[bool] = None
    khqr_merchant_name: Optional[str] = None
    khqr_merchant_city: Optional[str] = None
    khqr_merchant_id: Optional[str] = None
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    telegram_notifications_enabled: Optional[bool] = None
    default_warehouse_id: Optional[str] = None

class OrganizationResponse(BaseModel):
    id: str
    name: str
    code: str
    business_type: str
    owner_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    province: str
    district: Optional[str] = None
    logo_url: Optional[str] = None
    currency: str
    is_active: bool
    onboarding_completed: bool
    created_at: datetime
    settings: Optional[OrganizationSettingsResponse] = None

    class Config:
        from_attributes = True

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    business_type: Optional[str] = None
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    province: Optional[str] = None
    district: Optional[str] = None
    logo_url: Optional[str] = None
    currency: Optional[str] = None
    onboarding_completed: Optional[bool] = None

class OnboardingStepData(BaseModel):
    step: int
    data: dict
