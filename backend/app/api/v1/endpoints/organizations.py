from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.organization import Organization, OrganizationSettings
from app.models.warehouse import Warehouse
from app.schemas.organization import (
    OrganizationResponse,
    OrganizationUpdate,
    OrganizationSettingsResponse,
    OrganizationSettingsUpdate,
    OnboardingStepData
)
from app.dependencies.auth import get_current_user
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles
from app.models.user import User

router = APIRouter()

CAMBODIAN_PROVINCES = [
    {"en": "Phnom Penh", "kh": "រាជធានីភ្នំពេញ"},
    {"en": "Siem Reap", "kh": "ខេត្តសៀមរាប"},
    {"en": "Battambang", "kh": "ខេត្តបាត់ដំបង"},
    {"en": "Kampong Cham", "kh": "ខេត្តកំពង់ចាម"},
    {"en": "Kampong Chhnang", "kh": "ខេត្តកំពង់ឆ្នាំង"},
    {"en": "Kampong Speu", "kh": "ខេត្តកំពង់ស្ពឺ"},
    {"en": "Kampong Thom", "kh": "ខេត្តកំពង់ធំ"},
    {"en": "Kampot", "kh": "ខេត្តកំពត"},
    {"en": "Kandal", "kh": "ខេត្តកណ្តាល"},
    {"en": "Kep", "kh": "ខេត្តកែប"},
    {"en": "Koh Kong", "kh": "ខេត្តកោះកុង"},
    {"en": "Kratie", "kh": "ខេត្តក្រចេះ"},
    {"en": "Mondulkiri", "kh": "ខេត្តមណ្ឌលគិរី"},
    {"en": "Oddar Meanchey", "kh": "ខេត្តឧត្តរមានជ័យ"},
    {"en": "Pailin", "kh": "ខេត្តប៉ៃលិន"},
    {"en": "Preah Sihanouk", "kh": "ខេត្តព្រះសីហនុ"},
    {"en": "Preah Vihear", "kh": "ខេត្តព្រះវិហារ"},
    {"en": "Prey Veng", "kh": "ខេត្តព្រៃវែង"},
    {"en": "Pursat", "kh": "ខេត្តពោធិ៍សាត់"},
    {"en": "Ratanakiri", "kh": "ខេត្តរតនគិរី"},
    {"en": "Stung Treng", "kh": "ខេត្តស្ទឹងត្រែង"},
    {"en": "Svay Rieng", "kh": "ខេត្តស្វាយរៀង"},
    {"en": "Takeo", "kh": "ខេត្តតាកែវ"},
    {"en": "Tboung Khmum", "kh": "ខេត្តត្បូងឃ្មុំ"},
    {"en": "Banteay Meanchey", "kh": "ខេត្តបន្ទាយមានជ័យ"}
]

@router.get("/provinces")
def get_cambodian_provinces():
    """Returns the list of 25 provinces/municipalities of Cambodia."""
    return CAMBODIAN_PROVINCES

@router.get("/current", response_model=OrganizationResponse)
def get_current_organization(
    tenant: Organization = Depends(get_current_tenant)
):
    return tenant

@router.put("/current", response_model=OrganizationResponse)
def update_current_organization(
    data: OrganizationUpdate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin"])),
    db: Session = Depends(get_db)
):
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(tenant, key, value)
    db.commit()
    db.refresh(tenant)
    return tenant

@router.put("/current/settings", response_model=OrganizationSettingsResponse)
def update_organization_settings(
    data: OrganizationSettingsUpdate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin"])),
    db: Session = Depends(get_db)
):
    settings = db.query(OrganizationSettings).filter(OrganizationSettings.organization_id == tenant.id).first()
    if not settings:
        settings = OrganizationSettings(organization_id=tenant.id)
        db.add(settings)

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(settings, key, value)
    
    db.commit()
    db.refresh(settings)
    return settings

@router.post("/onboarding/complete")
def complete_onboarding(
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin"])),
    db: Session = Depends(get_db)
):
    tenant.onboarding_completed = True
    db.commit()
    return {"message": "Onboarding completed successfully", "onboarding_completed": True}

@router.post("/test-telegram")
def test_telegram_alert(
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin"])),
    db: Session = Depends(get_db)
):
    from app.services.telegram_service import TelegramService
    settings = db.query(OrganizationSettings).filter(OrganizationSettings.organization_id == tenant.id).first()
    bot_token = settings.telegram_bot_token if settings else None
    chat_id = settings.telegram_chat_id if settings else None
    
    svc = TelegramService(bot_token=bot_token, default_chat_id=chat_id)
    success = svc.send_message(
        f"🔔 <b>Cambodian SME Platform Notification Test</b>\n"
        f"🏢 <b>Business:</b> {tenant.name}\n"
        f"📍 <b>Location:</b> {tenant.province}\n"
        f"✅ Telegram bot alerts are operational for your business!",
        chat_id=chat_id
    )
    return {"success": success, "message": "Test alert dispatched successfully." if success else "Failed to dispatch Telegram alert."}

