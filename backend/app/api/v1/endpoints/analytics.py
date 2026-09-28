from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.warehouse import WarehouseStock
from app.models.partner import Customer
from app.models.organization import Organization
from app.schemas.dashboard import AnalyticsResponse, TopProductItem
from app.dependencies.tenant import get_current_tenant
from app.services.ai_insight_service import ai_insight_service
from app.api.v1.endpoints.dashboard import get_dashboard_data

router = APIRouter()

@router.get("", response_model=AnalyticsResponse)
def get_advanced_analytics(
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    # Fetch base dashboard response
    dash_data = get_dashboard_data(period="all", tenant=tenant, db=db)

    # 1. Average Order Value
    total_sales = dash_data.kpis.total_sales_usd
    order_count = db.query(Sale).filter(Sale.organization_id == tenant.id).count()
    aov = (total_sales / order_count) if order_count > 0 else 0.0

    # 2. Customers Analytics: new vs returning
    total_cust = dash_data.kpis.total_customers
    returning_cust = db.query(Customer).filter(
        Customer.organization_id == tenant.id,
        Customer.id.in_(
            db.query(Sale.customer_id).filter(Sale.organization_id == tenant.id)\
              .group_by(Sale.customer_id).having(func.count(Sale.id) > 1)
        )
    ).count()
    new_cust = max(0, total_cust - returning_cust)

    # 3. Dead Stock / Slow Moving Products
    # Products with stock > 0 that have 0 or very few sales
    sold_product_ids = db.query(SaleItem.product_id).filter(SaleItem.organization_id == tenant.id).distinct()
    dead_stock_query = db.query(Product).filter(
        Product.organization_id == tenant.id,
        Product.status == "active",
        ~Product.id.in_(sold_product_ids)
    ).limit(5).all()

    dead_stock = []
    for dp in dead_stock_query:
        stk = db.query(func.coalesce(func.sum(WarehouseStock.quantity), 0.0)).filter(
            WarehouseStock.product_id == dp.id,
            WarehouseStock.organization_id == tenant.id
        ).scalar() or 0.0
        if stk > 0:
            dead_stock.append(TopProductItem(
                name=dp.name_en,
                sku=dp.sku,
                units_sold=0.0,
                revenue=0.0
            ))

    # 4. Generate Rule-Based AI Business Insights
    top_p_name = dash_data.top_products[0].name if dash_data.top_products else None
    top_c_name = dash_data.category_shares[0].category if dash_data.category_shares else None

    metrics_for_ai = {
        "total_sales_usd": dash_data.kpis.total_sales_usd,
        "total_purchases_usd": dash_data.kpis.total_purchases_usd,
        "net_profit_usd": dash_data.kpis.net_profit_usd,
        "low_stock_products": dash_data.kpis.low_stock_products,
        "outstanding_receivables_usd": dash_data.kpis.outstanding_receivables_usd,
        "top_product_name": top_p_name,
        "top_category_name": top_c_name
    }

    insights = ai_insight_service.generate_insights(metrics_for_ai)

    return AnalyticsResponse(
        kpis=dash_data.kpis,
        sales_trend=dash_data.sales_trend,
        category_shares=dash_data.category_shares,
        top_products=dash_data.top_products,
        dead_stock_products=dead_stock,
        average_order_value=round(aov, 2),
        new_customers_count=new_cust,
        returning_customers_count=returning_cust,
        insights=insights
    )
