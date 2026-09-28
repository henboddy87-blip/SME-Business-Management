from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.organization import Organization, OrganizationSettings
from app.schemas.sale import KHQRPaymentGenerateRequest, KHQRPaymentGenerateResponse
from app.dependencies.tenant import get_current_tenant
from app.services.payment_service import payment_service

router = APIRouter()

@router.post("/khqr/generate", response_model=KHQRPaymentGenerateResponse)
def generate_khqr_code(
    data: KHQRPaymentGenerateRequest,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    settings = db.query(OrganizationSettings).filter(OrganizationSettings.organization_id == tenant.id).first()
    merchant_name = (settings.khqr_merchant_name if settings and settings.khqr_merchant_name else tenant.name) or "Khmer Style Fashion"
    merchant_city = (settings.khqr_merchant_city if settings and settings.khqr_merchant_city else tenant.province) or "Phnom Penh"
    merchant_id = (settings.khqr_merchant_id if settings and settings.khqr_merchant_id else f"{tenant.code.lower()}@bakong")

    result = payment_service.create_khqr_qr(
        amount=data.amount,
        currency=data.currency,
        invoice_number=data.invoice_number or "POS-DIRECT",
        merchant_name=merchant_name,
        merchant_id=merchant_id
    )

    return {
        "qr_code_string": result["qr_string"],
        "md5_hash": result["md5"],
        "currency": data.currency,
        "amount": data.amount,
        "merchant_name": merchant_name,
        "merchant_city": merchant_city,
        "merchant_id": merchant_id
    }

@router.get("/khqr/verify/{md5_hash}")
def verify_khqr_payment(
    md5_hash: str,
    tenant: Organization = Depends(get_current_tenant)
):
    provider = payment_service.get_provider("KHQR")
    verification = provider.verify_payment(md5_hash)
    return verification
