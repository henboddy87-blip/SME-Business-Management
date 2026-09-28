import io
import csv
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.sale import Sale, SaleItem
from app.models.purchase import Purchase, PurchaseItem
from app.models.product import Product, Category
from app.models.warehouse import WarehouseStock, Warehouse
from app.models.partner import Customer, Supplier
from app.models.organization import Organization
from app.dependencies.tenant import get_current_tenant

router = APIRouter()

@router.get("/sales")
def get_sales_report(
    group_by: str = Query("product", description="product, category, payment_method, customer"),
    export_csv: bool = False,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    if group_by == "product":
        rows = db.query(
            SaleItem.product_name,
            SaleItem.sku,
            func.sum(SaleItem.quantity).label("total_qty"),
            func.sum(SaleItem.subtotal).label("total_revenue")
        ).filter(SaleItem.organization_id == tenant.id)\
         .group_by(SaleItem.product_name, SaleItem.sku)\
         .order_by(func.sum(SaleItem.subtotal).desc()).all()

        data = [
            {"name": r[0], "sku": r[1], "quantity": float(r[2]), "revenue": float(r[3])}
            for r in rows
        ]

        if export_csv:
            out = io.StringIO()
            writer = csv.writer(out)
            writer.writerow(["Product Name", "SKU", "Units Sold", "Revenue (USD)"])
            for d in data:
                writer.writerow([d["name"], d["sku"], d["quantity"], d["revenue"]])
            out.seek(0)
            return Response(content=out.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=sales_by_product.csv"})

        return data

    elif group_by == "payment_method":
        rows = db.query(
            Sale.payment_method,
            func.count(Sale.id).label("transactions"),
            func.sum(Sale.total_amount_usd).label("total_usd")
        ).filter(Sale.organization_id == tenant.id)\
         .group_by(Sale.payment_method).all()

        return [
            {"payment_method": r[0], "transactions": int(r[1]), "total_usd": float(r[2])}
            for r in rows
        ]

    else:
        # Default daily sales
        rows = db.query(
            func.date(Sale.created_at).label("sale_date"),
            func.count(Sale.id).label("orders"),
            func.sum(Sale.total_amount_usd).label("revenue")
        ).filter(Sale.organization_id == tenant.id)\
         .group_by(func.date(Sale.created_at))\
         .order_by(func.date(Sale.created_at).desc()).all()

        return [
            {"date": str(r[0]), "orders": int(r[1]), "revenue": float(r[2])}
            for r in rows
        ]

@router.get("/inventory")
def get_inventory_report(
    export_csv: bool = False,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    rows = db.query(
        Product.sku,
        Product.name_en,
        Product.cost_price,
        Product.selling_price,
        func.coalesce(func.sum(WarehouseStock.quantity), 0.0).label("stock")
    ).outerjoin(WarehouseStock, (Product.id == WarehouseStock.product_id) & (WarehouseStock.organization_id == tenant.id))\
     .filter(Product.organization_id == tenant.id)\
     .group_by(Product.id).all()

    data = []
    total_val = 0.0
    for r in rows:
        stk = float(r[4])
        val = stk * r.cost_price
        total_val += val
        data.append({
            "sku": r.sku,
            "name": r.name_en,
            "cost_price": r.cost_price,
            "selling_price": r.selling_price,
            "current_stock": stk,
            "valuation_usd": round(val, 2)
        })

    if export_csv:
        out = io.StringIO()
        writer = csv.writer(out)
        writer.writerow(["SKU", "Product Name", "Cost Price", "Selling Price", "Current Stock", "Total Valuation"])
        for d in data:
            writer.writerow([d["sku"], d["name"], d["cost_price"], d["selling_price"], d["current_stock"], d["valuation_usd"]])
        out.seek(0)
        return Response(content=out.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=inventory_valuation.csv"})

    return {"total_valuation_usd": round(total_val, 2), "products": data}

@router.get("/purchases")
def get_purchases_report(
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    rows = db.query(
        Supplier.name,
        func.count(Purchase.id).label("purchase_count"),
        func.coalesce(func.sum(Purchase.total), 0.0).label("total_spending")
    ).join(Purchase, Supplier.id == Purchase.supplier_id)\
     .filter(Purchase.organization_id == tenant.id)\
     .group_by(Supplier.name).all()

    return [
        {"supplier_name": r[0], "purchases": int(r[1]), "total_spending_usd": float(r[2])}
        for r in rows
    ]
