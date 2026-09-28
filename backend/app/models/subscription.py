from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class SubscriptionPlan(BaseModel):
    __tablename__ = "subscription_plans"

    name = Column(String(100), unique=True, nullable=False) # Free, Starter, Business
    slug = Column(String(100), unique=True, nullable=False)
    price_usd = Column(Float, default=0.0, nullable=False)
    billing_period = Column(String(20), default="monthly") # monthly, yearly
    max_users = Column(Integer, default=1)
    max_products = Column(Integer, default=100)
    max_warehouses = Column(Integer, default=1)
    max_monthly_sales = Column(Integer, default=200)
    features = Column(Text, default="[]") # JSON string of feature keys
    is_active = Column(Boolean, default=True)

    subscriptions = relationship("Subscription", back_populates="plan")

class Subscription(BaseModel):
    __tablename__ = "subscriptions"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    plan_id = Column(String(36), ForeignKey("subscription_plans.id"), nullable=False)
    status = Column(String(50), default="active") # active, trial, past_due, cancelled
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    trial_end = Column(DateTime, nullable=True)
    cancel_at_period_end = Column(Boolean, default=False)

    organization = relationship("Organization", back_populates="subscription")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")

class UsageRecord(BaseModel):
    __tablename__ = "usage_records"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    period_key = Column(String(20), nullable=False, index=True) # e.g. "2026-09"
    sales_count = Column(Integer, default=0)
    products_count = Column(Integer, default=0)
    users_count = Column(Integer, default=0)
    warehouses_count = Column(Integer, default=0)
