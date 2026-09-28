from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models.product import Product
from app.models.partner import Customer, Supplier
from app.models.sale import Sale
from app.models.purchase import PurchaseOrder
from app.models.hr import Employee
from app.models.organization import Organization
from app.dependencies.tenant import get_current_tenant

router = APIRouter()

@router.get("")
def global_tenant_search(
    q: str = Query(..., min_length=1),
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Unified Global Search.
    Searches products, customers, suppliers, sales invoices, POs, and employees,
    strictly restricted to the authenticated user's organization!
    """
    search_pattern = f"%{q}%"
    results: List[Dict[str, Any]] = []

    # 1. Products
    products = db.query(Product).filter(
        Product.organization_id == tenant.id,
        or_(
            Product.name_en.ilike(search_pattern),
            Product.name_kh.ilike(search_pattern),
            Product.sku.ilike(search_pattern),
            Product.barcode.ilike(search_pattern)
        )
    ).limit(5).all()
    for p in products:
        results.append({
            "type": "Product",
            "id": p.id,
            "title": p.name_en,
            "subtitle": f"SKU: {p.sku} | ${p.selling_price:.2f}",
            "link": f"/products/{p.id}"
        })

    # 2. Customers
    customers = db.query(Customer).filter(
        Customer.organization_id == tenant.id,
        or_(Customer.name.ilike(search_pattern), Customer.phone.ilike(search_pattern))
    ).limit(5).all()
    for c in customers:
        results.append({
            "type": "Customer",
            "id": c.id,
            "title": c.name,
            "subtitle": f"Phone: {c.phone or 'N/A'} | Type: {c.customer_type}",
            "link": f"/customers/{c.id}"
        })

    # 3. Suppliers
    suppliers = db.query(Supplier).filter(
        Supplier.organization_id == tenant.id,
        or_(Supplier.name.ilike(search_pattern), Supplier.phone.ilike(search_pattern))
    ).limit(5).all()
    for s in suppliers:
        results.append({
            "type": "Supplier",
            "id": s.id,
            "title": s.name,
            "subtitle": f"Contact: {s.contact_person or 'N/A'}",
            "link": f"/purchasing/suppliers/{s.id}"
        })

    # 4. Sales / Invoices
    sales = db.query(Sale).filter(
        Sale.organization_id == tenant.id,
        Sale.invoice_number.ilike(search_pattern)
    ).limit(5).all()
    for s in sales:
        results.append({
            "type": "Sale Invoice",
            "id": s.id,
            "title": f"Invoice #{s.invoice_number}",
            "subtitle": f"Total: ${s.total_amount_usd:.2f} | Status: {s.payment_status}",
            "link": f"/sales/{s.id}"
        })

    # 5. Purchase Orders
    pos = db.query(PurchaseOrder).filter(
        PurchaseOrder.organization_id == tenant.id,
        PurchaseOrder.po_number.ilike(search_pattern)
    ).limit(5).all()
    for po in pos:
        results.append({
            "type": "Purchase Order",
            "id": po.id,
            "title": f"PO #{po.po_number}",
            "subtitle": f"Status: {po.status} | Total: ${po.total:.2f}",
            "link": f"/purchasing/orders/{po.id}"
        })

    # 6. Employees
    employees = db.query(Employee).filter(
        Employee.organization_id == tenant.id,
        or_(
            Employee.first_name.ilike(search_pattern),
            Employee.last_name.ilike(search_pattern),
            Employee.employee_code.ilike(search_pattern)
        )
    ).limit(5).all()
    for emp in employees:
        results.append({
            "type": "Employee",
            "id": emp.id,
            "title": f"{emp.first_name} {emp.last_name}",
            "subtitle": f"Code: {emp.employee_code} | {emp.position.title if emp.position else 'Staff'}",
            "link": f"/employees/{emp.id}"
        })

    return results
