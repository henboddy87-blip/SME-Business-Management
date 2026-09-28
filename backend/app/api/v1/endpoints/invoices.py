from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.invoice import Invoice
from app.models.sale import Sale
from app.models.organization import Organization
from app.schemas.quotation import InvoiceResponse
from app.schemas.sale import SaleResponse
from app.dependencies.tenant import get_current_tenant

router = APIRouter()

@router.get("", response_model=List[InvoiceResponse])
def list_invoices(
    customer_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    query = db.query(Invoice).filter(Invoice.organization_id == tenant.id)
    if customer_id:
        query = query.filter(Invoice.customer_id == customer_id)
    if status_filter:
        query = query.filter(Invoice.status == status_filter)

    invoices = query.order_by(Invoice.issue_date.desc()).all()
    res = []
    for inv in invoices:
        inv_dict = InvoiceResponse.model_validate(inv)
        if inv.customer:
            inv_dict.customer_name = inv.customer.name
        res.append(inv_dict)
    return res

@router.get("/{invoice_id}")
def get_invoice_details(
    invoice_id: str,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Returns full invoice details including business profile, logo, settings, customer info, and items
    ready for printable display and PDF generation.
    """
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.organization_id == tenant.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    sale = db.query(Sale).filter(Sale.id == invoice.sale_id).first() if invoice.sale_id else None

    items = []
    if sale:
        for it in sale.items:
            items.append({
                "product_name": it.product_name,
                "sku": it.sku,
                "quantity": it.quantity,
                "unit_price": it.unit_price,
                "discount": it.discount,
                "subtotal": it.subtotal
            })

    return {
        "invoice_number": invoice.invoice_number,
        "issue_date": invoice.issue_date,
        "due_date": invoice.due_date,
        "status": invoice.status,
        "subtotal": invoice.subtotal,
        "tax": invoice.tax,
        "discount": invoice.discount,
        "total": invoice.total,
        "total_khr": invoice.total * (tenant.settings.khr_exchange_rate if tenant.settings else 4100.0),
        "paid_amount": invoice.paid_amount,
        "notes": invoice.notes,
        "business": {
            "name": tenant.name,
            "owner": tenant.owner_name,
            "phone": tenant.phone,
            "email": tenant.email,
            "address": tenant.address,
            "province": tenant.province,
            "logo_url": tenant.logo_url,
            "tax_number": tenant.settings.tax_number if tenant.settings else None,
            "footer_en": tenant.settings.invoice_footer_en if tenant.settings else "Thank you for your business!",
            "footer_kh": tenant.settings.invoice_footer_kh if tenant.settings else "សូមអរគុណចំពោះការគាំទ្ររបស់លោកអ្នក!"
        },
        "customer": {
            "name": invoice.customer.name if invoice.customer else "General Customer / អតិថិជនទូទៅ",
            "phone": invoice.customer.phone if invoice.customer else "-",
            "address": invoice.customer.address if invoice.customer else "-",
            "province": invoice.customer.province if invoice.customer else "-"
        },
        "items": items
    }
