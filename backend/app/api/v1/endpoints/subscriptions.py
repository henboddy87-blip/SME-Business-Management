from typing import List
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.subscription import Subscription, SubscriptionPlan, UsageRecord
from app.models.organization import Organization
from app.models.user import User
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.models.sale import Sale
from app.schemas.subscription import (
    SubscriptionPlanResponse, SubscriptionResponse,
    UsageSummaryResponse, UpgradePlanRequest
)
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles
from app.services.audit_service import log_audit_event

router = APIRouter()

@router.get("/plans", response_model=List[SubscriptionPlanResponse])
def list_available_plans(db: Session = Depends(get_db)):
    return db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()

@router.get("/current", response_model=SubscriptionResponse)
def get_current_subscription(
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    sub = db.query(Subscription).filter(Subscription.organization_id == tenant.id).first()
    if not sub:
        # Fallback to free plan
        free_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == "free").first()
        sub = Subscription(
            organization_id=tenant.id,
            plan_id=free_plan.id,
            status="active"
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)
    return sub

@router.get("/usage", response_model=UsageSummaryResponse)
def get_usage_summary(
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    sub = db.query(Subscription).filter(Subscription.organization_id == tenant.id).first()
    plan = sub.plan if sub and sub.plan else db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == "free").first()

    users_count = db.query(User).filter(User.organization_id == tenant.id, User.is_active == True).count()
    products_count = db.query(Product).filter(Product.organization_id == tenant.id, Product.status == "active").count()
    warehouses_count = db.query(Warehouse).filter(Warehouse.organization_id == tenant.id, Warehouse.status == "active").count()

    current_month = datetime.now().strftime("%Y-%m")
    sales_count = db.query(Sale).filter(
        Sale.organization_id == tenant.id,
        func.strftime("%Y-%m", Sale.created_at) == current_month
    ).count()

    return UsageSummaryResponse(
        current_users=users_count,
        max_users=plan.max_users,
        current_products=products_count,
        max_products=plan.max_products,
        current_warehouses=warehouses_count,
        max_warehouses=plan.max_warehouses,
        monthly_sales=sales_count,
        max_monthly_sales=plan.max_monthly_sales,
        plan_name=plan.name,
        plan_slug=plan.slug
    )

@router.post("/upgrade", response_model=SubscriptionResponse)
def upgrade_plan(
    data: UpgradePlanRequest,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner"])),
    db: Session = Depends(get_db)
):
    target_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == data.plan_slug).first()
    if not target_plan:
        raise HTTPException(status_code=404, detail="Subscription plan not found")

    sub = db.query(Subscription).filter(Subscription.organization_id == tenant.id).first()
    if not sub:
        sub = Subscription(organization_id=tenant.id, plan_id=target_plan.id, status="active")
        db.add(sub)
    else:
        sub.plan_id = target_plan.id
        sub.status = "active"
        sub.current_period_start = datetime.now(timezone.utc)
        sub.current_period_end = datetime.now(timezone.utc) + timedelta(days=30)

    log_audit_event(
        db,
        organization_id=tenant.id,
        action="UPGRADE_PLAN",
        entity="Subscription",
        user=current_user,
        new_value=f"Upgraded subscription plan to {target_plan.name}"
    )

    db.commit()
    db.refresh(sub)
    return sub
