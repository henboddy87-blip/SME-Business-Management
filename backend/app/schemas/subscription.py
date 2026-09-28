from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class SubscriptionPlanResponse(BaseModel):
    id: str
    name: str
    slug: str
    price_usd: float
    billing_period: str
    max_users: int
    max_products: int
    max_warehouses: int
    max_monthly_sales: int
    features: str
    is_active: bool

    class Config:
        from_attributes = True

class SubscriptionResponse(BaseModel):
    id: str
    organization_id: str
    status: str
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    plan: SubscriptionPlanResponse

    class Config:
        from_attributes = True

class UsageSummaryResponse(BaseModel):
    current_users: int
    max_users: int
    current_products: int
    max_products: int
    current_warehouses: int
    max_warehouses: int
    monthly_sales: int
    max_monthly_sales: int
    plan_name: str
    plan_slug: str

class UpgradePlanRequest(BaseModel):
    plan_slug: str
