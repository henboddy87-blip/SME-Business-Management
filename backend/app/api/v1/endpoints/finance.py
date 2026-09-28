import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.finance import Payment, Expense, ExpenseCategory
from app.models.sale import Sale, SaleItem
from app.models.purchase import Purchase
from app.models.partner import Customer, Supplier
from app.models.organization import Organization
from app.models.user import User
from app.schemas.finance import (
    PaymentResponse, PaymentCreate,
    CashFlowSummary, ProfitAndLossSummary
)
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles
from app.services.audit_service import log_audit_event

router = APIRouter()

@router.get("/payments", response_model=List[PaymentResponse])
def list_payments(
    reference_type: Optional[str] = None,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    query = db.query(Payment).filter(Payment.organization_id == tenant.id)
    if reference_type:
        query = query.filter(Payment.reference_type == reference_type)

    payments = query.order_by(Payment.payment_date.desc()).all()
    res = []
    for p in payments:
        pd = PaymentResponse.model_validate(p)
        if p.customer:
            pd.customer_name = p.customer.name
        if p.supplier:
            pd.supplier_name = p.supplier.name
        res.append(pd)
    return res

@router.post("/payments", response_model=PaymentResponse)
def create_payment(
    data: PaymentCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Accountant"])),
    db: Session = Depends(get_db)
):
    pay_num = "PAY-" + str(uuid.uuid4())[:8].upper()
    amount_khr = data.amount_usd * 4100.0

    payment = Payment(
        organization_id=tenant.id,
        payment_number=pay_num,
        reference_type=data.reference_type,
        reference_id=data.reference_id,
        customer_id=data.customer_id,
        supplier_id=data.supplier_id,
        amount_usd=data.amount_usd,
        amount_khr=amount_khr,
        currency=data.currency,
        payment_method=data.payment_method,
        payment_provider_ref=data.payment_provider_ref,
        status="Completed",
        payment_date=data.payment_date,
        created_by=current_user.id
    )
    db.add(payment)

    # If customer debt payment, deduct customer's outstanding balance
    if data.customer_id and data.reference_type == "CustomerPayment":
        cust = db.query(Customer).filter(Customer.id == data.customer_id, Customer.organization_id == tenant.id).first()
        if cust:
            cust.outstanding_balance = max(0.0, cust.outstanding_balance - data.amount_usd)

    # If supplier bill payment, deduct supplier's outstanding balance
    if data.supplier_id and data.reference_type == "SupplierPayment":
        supp = db.query(Supplier).filter(Supplier.id == data.supplier_id, Supplier.organization_id == tenant.id).first()
        if supp:
            supp.outstanding_balance = max(0.0, supp.outstanding_balance - data.amount_usd)

    log_audit_event(
        db,
        organization_id=tenant.id,
        action="RECORD_PAYMENT",
        entity="Payment",
        entity_id=pay_num,
        user=current_user,
        new_value=f"Recorded payment {pay_num} of ${data.amount_usd:.2f} ({data.reference_type})"
    )

    db.commit()
    db.refresh(payment)
    return payment

@router.get("/cash-flow", response_model=CashFlowSummary)
def get_cash_flow(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    # Total Cash Inflows: Sales payments + Customer payments
    sales_inflow = float(db.query(func.coalesce(func.sum(Sale.paid_amount_usd), 0.0)).filter(
        Sale.organization_id == tenant.id
    ).scalar() or 0.0)

    customer_debt_inflow = float(db.query(func.coalesce(func.sum(Payment.amount_usd), 0.0)).filter(
        Payment.organization_id == tenant.id,
        Payment.reference_type == "CustomerPayment"
    ).scalar() or 0.0)

    total_inflow = sales_inflow + customer_debt_inflow

    # Total Cash Outflows: Direct purchase payments + Expenses + Supplier debt payments
    purchase_outflow = float(db.query(func.coalesce(func.sum(Purchase.paid_amount), 0.0)).filter(
        Purchase.organization_id == tenant.id
    ).scalar() or 0.0)

    expenses_outflow = float(db.query(func.coalesce(func.sum(Expense.amount_usd), 0.0)).filter(
        Expense.organization_id == tenant.id
    ).scalar() or 0.0)

    supplier_debt_outflow = float(db.query(func.coalesce(func.sum(Payment.amount_usd), 0.0)).filter(
        Payment.organization_id == tenant.id,
        Payment.reference_type == "SupplierPayment"
    ).scalar() or 0.0)

    total_outflow = purchase_outflow + expenses_outflow + supplier_debt_outflow

    opening_balance = 1000.0 # Standard base opening float
    net_cash_flow = total_inflow - total_outflow
    closing_balance = opening_balance + net_cash_flow

    return {
        "opening_balance_usd": opening_balance,
        "total_inflow_usd": total_inflow,
        "total_outflow_usd": total_outflow,
        "net_cash_flow_usd": net_cash_flow,
        "closing_balance_usd": closing_balance,
        "inflow_details": {
            "Sales Cash Inflow": sales_inflow,
            "Customer Credit Inflow": customer_debt_inflow
        },
        "outflow_details": {
            "Purchases Paid": purchase_outflow,
            "Operating Expenses": expenses_outflow,
            "Supplier Payments": supplier_debt_outflow
        }
    }

@router.get("/profit-and-loss", response_model=ProfitAndLossSummary)
def get_profit_and_loss(
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    # Revenue = total sales realized
    revenue = float(db.query(func.coalesce(func.sum(Sale.total_amount_usd), 0.0)).filter(
        Sale.organization_id == tenant.id,
        Sale.status == "Completed"
    ).scalar() or 0.0)

    # Cost of Goods Sold (COGS) = Sum(sale_items.quantity * sale_items.unit_cost)
    cogs = float(db.query(func.coalesce(func.sum(SaleItem.quantity * SaleItem.unit_cost), 0.0)).filter(
        SaleItem.organization_id == tenant.id
    ).scalar() or 0.0)

    gross_profit = revenue - cogs

    # Operating expenses
    operating_expenses = float(db.query(func.coalesce(func.sum(Expense.amount_usd), 0.0)).filter(
        Expense.organization_id == tenant.id
    ).scalar() or 0.0)

    net_profit = gross_profit - operating_expenses

    gross_margin_percent = (gross_profit / revenue * 100.0) if revenue > 0 else 0.0
    net_margin_percent = (net_profit / revenue * 100.0) if revenue > 0 else 0.0

    # Expense breakdown by category
    expense_rows = db.query(
        ExpenseCategory.name_en,
        func.coalesce(func.sum(Expense.amount_usd), 0.0)
    ).join(Expense, ExpenseCategory.id == Expense.category_id)\
     .filter(Expense.organization_id == tenant.id)\
     .group_by(ExpenseCategory.name_en).all()

    breakdown = {row[0]: float(row[1]) for row in expense_rows}

    return {
        "revenue_usd": revenue,
        "cost_of_goods_sold_usd": cogs,
        "gross_profit_usd": gross_profit,
        "operating_expenses_usd": operating_expenses,
        "net_profit_usd": net_profit,
        "gross_margin_percent": round(gross_margin_percent, 1),
        "net_margin_percent": round(net_margin_percent, 1),
        "expense_breakdown": breakdown
    }
