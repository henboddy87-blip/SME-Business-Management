from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class KPICards(BaseModel):
    total_sales_usd: float
    total_sales_khr: float
    total_purchases_usd: float
    gross_profit_usd: float
    net_profit_usd: float
    inventory_value_usd: float
    total_customers: int
    total_products: int
    low_stock_products: int
    outstanding_receivables_usd: float
    outstanding_payables_usd: float
    total_expenses_usd: float

class TrendPoint(BaseModel):
    date: str
    sales: float
    purchases: float
    profit: float
    expenses: float

class CategoryShare(BaseModel):
    category: str
    amount: float
    percentage: float

class TopProductItem(BaseModel):
    name: str
    sku: str
    units_sold: float
    revenue: float

class PaymentMethodShare(BaseModel):
    method: str
    count: int
    total: float

class DashboardResponse(BaseModel):
    kpis: KPICards
    sales_trend: List[TrendPoint]
    category_shares: List[CategoryShare]
    top_products: List[TopProductItem]
    payment_method_shares: List[PaymentMethodShare]

class BusinessInsight(BaseModel):
    id: str
    type: str # positive, warning, recommendation, neutral
    title: str
    description: str
    metric: Optional[str] = None
    action_label: Optional[str] = None
    action_url: Optional[str] = None

class AnalyticsResponse(BaseModel):
    kpis: KPICards
    sales_trend: List[TrendPoint]
    category_shares: List[CategoryShare]
    top_products: List[TopProductItem]
    dead_stock_products: List[TopProductItem]
    average_order_value: float
    new_customers_count: int
    returning_customers_count: int
    insights: List[BusinessInsight]
