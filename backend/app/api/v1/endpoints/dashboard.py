from typing import List, Optional
from datetime import datetime, timedelta, date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.sale import Sale, SaleItem
from app.models.purchase import Purchase
from app.models.product import Product, Category
from app.models.warehouse import WarehouseStock
from app.models.partner import Customer, Supplier
from app.models.finance import Expense, Payment
from app.models.organization import Organization
from app.schemas.dashboard import (
    DashboardResponse, KPICards, TrendPoint, CategoryShare,
    TopProductItem, PaymentMethodShare
)
from app.dependencies.tenant import get_current_tenant

router = APIRouter()

@router.get("", response_model=DashboardResponse)
def get_dashboard_data(
    period: str = Query("month", description="today, week, month, year, all"),
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    # 1. Total Sales & KHR
    total_sales_usd = float(db.query(func.coalesce(func.sum(Sale.total_amount_usd), 0.0)).filter(
        Sale.organization_id == tenant.id,
        Sale.status == "Completed"
    ).scalar() or 0.0)
    
    khr_rate = tenant.settings.khr_exchange_rate if tenant.settings else 4100.0
    total_sales_khr = total_sales_usd * khr_rate

    # 2. Total Purchases
    total_purchases_usd = float(db.query(func.coalesce(func.sum(Purchase.total), 0.0)).filter(
        Purchase.organization_id == tenant.id
    ).scalar() or 0.0)

    # 3. Gross Profit & Net Profit
    cogs = float(db.query(func.coalesce(func.sum(SaleItem.quantity * SaleItem.unit_cost), 0.0)).filter(
        SaleItem.organization_id == tenant.id
    ).scalar() or 0.0)
    gross_profit_usd = total_sales_usd - cogs

    total_expenses_usd = float(db.query(func.coalesce(func.sum(Expense.amount_usd), 0.0)).filter(
        Expense.organization_id == tenant.id
    ).scalar() or 0.0)
    net_profit_usd = gross_profit_usd - total_expenses_usd

    # 4. Inventory Value
    inventory_val = float(db.query(func.coalesce(func.sum(WarehouseStock.quantity * Product.cost_price), 0.0))\
        .join(Product, WarehouseStock.product_id == Product.id)\
        .filter(WarehouseStock.organization_id == tenant.id).scalar() or 0.0)

    # 5. Entity counts
    total_customers = db.query(Customer).filter(Customer.organization_id == tenant.id).count()
    total_products = db.query(Product).filter(Product.organization_id == tenant.id, Product.status == "active").count()

    # 6. Low stock products count
    low_stock_count = 0
    prods = db.query(Product).filter(Product.organization_id == tenant.id, Product.status == "active").all()
    for p in prods:
        stk_sum = float(db.query(func.coalesce(func.sum(WarehouseStock.quantity), 0.0)).filter(
            WarehouseStock.product_id == p.id,
            WarehouseStock.organization_id == tenant.id
        ).scalar() or 0.0)
        if stk_sum <= p.min_stock:
            low_stock_count += 1

    # 7. Receivables and Payables
    outstanding_receivables = float(db.query(func.coalesce(func.sum(Customer.outstanding_balance), 0.0)).filter(
        Customer.organization_id == tenant.id
    ).scalar() or 0.0)

    outstanding_payables = float(db.query(func.coalesce(func.sum(Supplier.outstanding_balance), 0.0)).filter(
        Supplier.organization_id == tenant.id
    ).scalar() or 0.0)

    kpis = KPICards(
        total_sales_usd=round(total_sales_usd, 2),
        total_sales_khr=round(total_sales_khr, 0),
        total_purchases_usd=round(total_purchases_usd, 2),
        gross_profit_usd=round(gross_profit_usd, 2),
        net_profit_usd=round(net_profit_usd, 2),
        inventory_value_usd=round(inventory_val, 2),
        total_customers=total_customers,
        total_products=total_products,
        low_stock_products=low_stock_count,
        outstanding_receivables_usd=round(outstanding_receivables, 2),
        outstanding_payables_usd=round(outstanding_payables, 2),
        total_expenses_usd=round(total_expenses_usd, 2)
    )

    # 8. Sales Trend (Last 7 days or periods)
    today = date.today()
    trend_points = []
    for i in range(6, -1, -1):
        day_date = today - timedelta(days=i)
        day_str = day_date.strftime("%Y-%m-%d")
        
        # Sales on day
        s_val = float(db.query(func.coalesce(func.sum(Sale.total_amount_usd), 0.0)).filter(
            Sale.organization_id == tenant.id,
            func.date(Sale.created_at) == day_str
        ).scalar() or 0.0)

        # Purchases on day
        p_val = float(db.query(func.coalesce(func.sum(Purchase.total), 0.0)).filter(
            Purchase.organization_id == tenant.id,
            func.date(Purchase.created_at) == day_str
        ).scalar() or 0.0)

        # Expenses on day
        e_val = float(db.query(func.coalesce(func.sum(Expense.amount_usd), 0.0)).filter(
            Expense.organization_id == tenant.id,
            func.date(Expense.date) == day_str
        ).scalar() or 0.0)

        profit = s_val - (s_val * 0.6) - e_val # Estimated gross profit proxy for chart

        trend_points.append(TrendPoint(
            date=day_date.strftime("%b %d"),
            sales=round(s_val, 2),
            purchases=round(p_val, 2),
            profit=round(max(0.0, profit), 2),
            expenses=round(e_val, 2)
        ))

    # 9. Category breakdown
    cat_rows = db.query(
        Category.name_en,
        func.coalesce(func.sum(SaleItem.subtotal), 0.0)
    ).join(Product, Category.id == Product.category_id)\
     .join(SaleItem, Product.id == SaleItem.product_id)\
     .filter(SaleItem.organization_id == tenant.id)\
     .group_by(Category.name_en).all()

    category_shares = []
    cat_total = sum(float(r[1]) for r in cat_rows) or 1.0
    for c_name, val in cat_rows:
        category_shares.append(CategoryShare(
            category=c_name,
            amount=round(float(val), 2),
            percentage=round(float(val) / cat_total * 100.0, 1)
        ))

    if not category_shares:
        category_shares.append(CategoryShare(category="General", amount=total_sales_usd, percentage=100.0))

    # 10. Top Products
    top_rows = db.query(
        SaleItem.product_name,
        SaleItem.sku,
        func.sum(SaleItem.quantity),
        func.sum(SaleItem.subtotal)
    ).filter(SaleItem.organization_id == tenant.id)\
     .group_by(SaleItem.product_name, SaleItem.sku)\
     .order_by(func.sum(SaleItem.subtotal).desc())\
     .limit(5).all()

    top_products = [
        TopProductItem(name=r[0], sku=r[1], units_sold=float(r[2]), revenue=float(r[3]))
        for r in top_rows
    ]

    # 11. Payment Methods Share
    pm_rows = db.query(
        Sale.payment_method,
        func.count(Sale.id),
        func.coalesce(func.sum(Sale.total_amount_usd), 0.0)
    ).filter(Sale.organization_id == tenant.id)\
     .group_by(Sale.payment_method).all()

    payment_shares = [
        PaymentMethodShare(method=r[0], count=int(r[1]), total=float(r[2]))
        for r in pm_rows
    ]

    return DashboardResponse(
        kpis=kpis,
        sales_trend=trend_points,
        category_shares=category_shares,
        top_products=top_products,
        payment_method_shares=payment_shares
    )
