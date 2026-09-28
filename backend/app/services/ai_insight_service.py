from typing import List, Dict, Any
from app.schemas.dashboard import BusinessInsight

class AIInsightService:
    """
    Business Insight Engine.
    Produces clear, rule-based natural language business intelligence from transactional metrics,
    with an architecture designed to easily plug in LLM models in the future.
    """
    def generate_insights(self, metrics: Dict[str, Any]) -> List[BusinessInsight]:
        insights: List[BusinessInsight] = []

        total_sales = metrics.get("total_sales_usd", 0.0)
        total_purchases = metrics.get("total_purchases_usd", 0.0)
        net_profit = metrics.get("net_profit_usd", 0.0)
        low_stock_count = metrics.get("low_stock_products", 0)
        outstanding_receivables = metrics.get("outstanding_receivables_usd", 0.0)
        top_product = metrics.get("top_product_name")
        top_category = metrics.get("top_category_name")

        # Insight 1: Sales & Profitability Analysis
        if total_sales > 0:
            margin = (net_profit / total_sales) * 100 if total_sales else 0
            if margin >= 25:
                insights.append(BusinessInsight(
                    id="profit-healthy",
                    type="positive",
                    title="Strong Profit Margin",
                    description=f"Your net profit margin is sitting at an excellent {margin:.1f}%. Operational overhead is well controlled.",
                    metric=f"+{margin:.1f}% Margin",
                    action_label="View Profit & Loss",
                    action_url="/finance"
                ))
            elif margin > 0:
                insights.append(BusinessInsight(
                    id="profit-moderate",
                    type="neutral",
                    title="Healthy Operational Trajectory",
                    description=f"Business is profitable with a {margin:.1f}% net margin. Focus on promoting higher-margin items to boost returns.",
                    metric=f"{margin:.1f}% Margin",
                    action_label="Review Pricing",
                    action_url="/products"
                ))
            else:
                insights.append(BusinessInsight(
                    id="profit-warning",
                    type="warning",
                    title="Expenses Exceed Revenue",
                    description="Operating costs and purchases currently exceed realized sales. Consider auditing recurring operating expenses.",
                    metric="Negative Cash Flow",
                    action_label="Audit Expenses",
                    action_url="/finance"
                ))

        # Insight 2: Top Selling Product & Category
        if top_product:
            insights.append(BusinessInsight(
                id="top-performer",
                type="positive",
                title=f"Star Performer: {top_product}",
                description=f"'{top_product}' is currently your highest grossing item. Ensure safety stock is maintained across your warehouses.",
                metric="Bestseller",
                action_label="Manage Stock",
                action_url="/inventory"
            ))

        # Insight 3: Inventory replenishment warnings
        if low_stock_count > 0:
            insights.append(BusinessInsight(
                id="stock-alert",
                type="warning",
                title=f"{low_stock_count} Product(s) Below Minimum Stock",
                description=f"There are {low_stock_count} products nearing depletion. Create a purchase order to prevent stockouts and lost revenue.",
                metric=f"{low_stock_count} Low Items",
                action_label="Create Purchase Order",
                action_url="/purchasing/orders/new"
            ))

        # Insight 4: Outstanding receivables from customers
        if outstanding_receivables > 0:
            insights.append(BusinessInsight(
                id="receivables-notice",
                type="recommendation",
                title="Customer Credit Outstanding",
                description=f"You have ${outstanding_receivables:.2f} in unpaid credit across customer accounts. Sending payment reminders could accelerate cash inflow.",
                metric=f"${outstanding_receivables:.2f} Pending",
                action_label="View Receivables",
                action_url="/customers"
            ))

        # Fallback default if new business
        if not insights:
            insights.append(BusinessInsight(
                id="welcome-guide",
                type="neutral",
                title="Welcome to your SME Business Analytics",
                description="As you record sales, purchases, and expenses, the system will automatically analyze your business performance and highlight operational tips.",
                action_label="Make First Sale",
                action_url="/sales/pos"
            ))

        return insights

ai_insight_service = AIInsightService()
