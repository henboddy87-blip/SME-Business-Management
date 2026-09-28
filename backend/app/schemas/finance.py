from typing import Optional, List, Dict
from pydantic import BaseModel
from datetime import datetime

class ExpenseCategoryCreate(BaseModel):
    name_en: str
    name_kh: Optional[str] = None
    description: Optional[str] = None

class ExpenseCategoryResponse(BaseModel):
    id: str
    name_en: str
    name_kh: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True

class ExpenseCreate(BaseModel):
    category_id: str
    amount_usd: float
    currency: str = "USD"
    payment_method: str = "Cash"
    date: datetime
    description: Optional[str] = None
    receipt_url: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: str
    expense_number: str
    category_id: str
    category_name: Optional[str] = None
    amount_usd: float
    amount_khr: float
    currency: str
    payment_method: str
    date: datetime
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    reference_type: str # Sale, Purchase, Expense, CustomerPayment, SupplierPayment
    reference_id: Optional[str] = None
    customer_id: Optional[str] = None
    supplier_id: Optional[str] = None
    amount_usd: float
    currency: str = "USD"
    payment_method: str = "Cash"
    payment_provider_ref: Optional[str] = None
    payment_date: datetime

class PaymentResponse(BaseModel):
    id: str
    payment_number: str
    reference_type: str
    reference_id: Optional[str] = None
    customer_name: Optional[str] = None
    supplier_name: Optional[str] = None
    amount_usd: float
    amount_khr: float
    currency: str
    payment_method: str
    status: str
    payment_date: datetime

    class Config:
        from_attributes = True

class CashFlowSummary(BaseModel):
    opening_balance_usd: float
    total_inflow_usd: float
    total_outflow_usd: float
    net_cash_flow_usd: float
    closing_balance_usd: float
    inflow_details: Dict[str, float]
    outflow_details: Dict[str, float]

class ProfitAndLossSummary(BaseModel):
    revenue_usd: float
    cost_of_goods_sold_usd: float
    gross_profit_usd: float
    operating_expenses_usd: float
    net_profit_usd: float
    gross_margin_percent: float
    net_margin_percent: float
    expense_breakdown: Dict[str, float]
