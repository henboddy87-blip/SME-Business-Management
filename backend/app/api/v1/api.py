from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    organizations,
    users,
    products,
    categories,
    warehouses,
    inventory,
    customers,
    suppliers,
    purchases,
    sales,
    payments,
    quotations,
    invoices,
    expenses,
    finance,
    employees,
    attendance,
    leaves,
    dashboard,
    analytics,
    reports,
    subscriptions,
    superadmin,
    search,
    notifications,
    audit_logs
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Roles"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories, Brands & Units"])
api_router.include_router(warehouses.router, prefix="/warehouses", tags=["Warehouses"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory & Stock Movements"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["Suppliers"])
api_router.include_router(purchases.router, prefix="/purchases", tags=["Purchasing & Receiving"])
api_router.include_router(sales.router, prefix="/sales", tags=["Sales & POS"])
api_router.include_router(payments.router, prefix="/payments", tags=["KHQR & Payment Gateway"])
api_router.include_router(quotations.router, prefix="/quotations", tags=["Quotations"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["Expenses"])
api_router.include_router(finance.router, prefix="/finance", tags=["Finance & Cash Flow"])
api_router.include_router(employees.router, prefix="/employees", tags=["Employees & HR"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance & Payroll"])
api_router.include_router(leaves.router, prefix="/leaves", tags=["Leave Requests"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & AI Insights"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["SaaS Subscriptions"])
api_router.include_router(superadmin.router, prefix="/superadmin", tags=["Super Admin Platform"])
api_router.include_router(search.router, prefix="/search", tags=["Global Search"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["Audit Logs"])
