from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.organization import Organization
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionPlan
from app.models.sale import Sale
from app.models.audit import AuditLog
from app.schemas.organization import OrganizationResponse
from app.schemas.audit import AuditLogResponse
from app.dependencies.auth import get_current_super_admin

router = APIRouter()

@router.get("/dashboard")
def get_superadmin_dashboard(
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    total_orgs = db.query(Organization).count()
    active_orgs = db.query(Organization).filter(Organization.is_active == True).count()
    total_users = db.query(User).filter(User.is_super_admin == False).count()
    total_sales_tx = db.query(Sale).count()

    plan_counts = db.query(
        SubscriptionPlan.name,
        func.count(Subscription.id)
    ).join(Subscription, SubscriptionPlan.id == Subscription.plan_id)\
     .group_by(SubscriptionPlan.name).all()

    plan_distribution = {row[0]: int(row[1]) for row in plan_counts}

    return {
        "total_businesses": total_orgs,
        "active_businesses": active_orgs,
        "inactive_businesses": total_orgs - active_orgs,
        "total_platform_users": total_users,
        "total_transactions": total_sales_tx,
        "plan_distribution": plan_distribution
    }

@router.get("/businesses", response_model=List[OrganizationResponse])
def list_all_businesses(
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    return db.query(Organization).order_by(Organization.created_at.desc()).all()

@router.put("/businesses/{org_id}/toggle-status")
def toggle_business_status(
    org_id: str,
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    org.is_active = not org.is_active
    db.commit()
    return {"message": f"Organization '{org.name}' is now {'active' if org.is_active else 'inactive'}", "is_active": org.is_active}

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_platform_audit_logs(
    current_admin: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    return logs
