from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.organization import Organization
from app.models.subscription import Subscription, SubscriptionPlan, UsageRecord
from app.models.user import User
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.models.sale import Sale

def check_plan_limit(db: Session, organization_id: str, resource_type: str):
    """
    Validates whether the organization is within its subscription plan limits.
    resource_type can be: 'users', 'products', 'warehouses', 'sales'
    """
    subscription = db.query(Subscription).filter(Subscription.organization_id == organization_id).first()
    if not subscription or not subscription.plan:
        # Default fallback to Free plan if none configured
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == "free").first()
    else:
        plan = subscription.plan

    if not plan:
        return True

    if resource_type == "users":
        count = db.query(func.count(User.id)).filter(User.organization_id == organization_id, User.is_active == True).scalar()
        if plan.max_users != -1 and count >= plan.max_users:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Plan limit reached: Your current plan '{plan.name}' allows a maximum of {plan.max_users} user(s). Please upgrade your subscription to add more users."
            )

    elif resource_type == "products":
        count = db.query(func.count(Product.id)).filter(Product.organization_id == organization_id, Product.status == "active").scalar()
        if plan.max_products != -1 and count >= plan.max_products:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Plan limit reached: Your current plan '{plan.name}' allows a maximum of {plan.max_products} product(s). Please upgrade your subscription to add more products."
            )

    elif resource_type == "warehouses":
        count = db.query(func.count(Warehouse.id)).filter(Warehouse.organization_id == organization_id, Warehouse.status == "active").scalar()
        if plan.max_warehouses != -1 and count >= plan.max_warehouses:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Plan limit reached: Your current plan '{plan.name}' allows a maximum of {plan.max_warehouses} warehouse(s). Please upgrade your subscription to create additional warehouses."
            )

    elif resource_type == "sales":
        # Monthly sales count
        current_month_prefix = datetime.now().strftime("%Y-%m")
        count = db.query(func.count(Sale.id)).filter(
            Sale.organization_id == organization_id,
            func.strftime("%Y-%m", Sale.created_at) == current_month_prefix
        ).scalar()
        if plan.max_monthly_sales != -1 and count >= plan.max_monthly_sales:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Plan limit reached: Your current plan '{plan.name}' allows a maximum of {plan.max_monthly_sales} sales transactions per month. Please upgrade your subscription to continue making sales."
            )

    return True
