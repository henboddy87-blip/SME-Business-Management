import csv
import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.core.database import get_db
from app.models.product import Product, ProductVariant, Category, Brand, Unit
from app.models.warehouse import Warehouse, WarehouseStock
from app.models.inventory import StockMovement
from app.models.organization import Organization
from app.models.user import User
from app.schemas.product import (
    ProductResponse, ProductCreate, ProductUpdate,
    ProductVariantCreate, ProductVariantResponse
)
from app.schemas.common import PaginatedResponse
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles
from app.services.plan_limit_service import check_plan_limit
from app.services.audit_service import log_audit_event

router = APIRouter()

def compute_product_stock_status(total_stock: float, min_stock: float, max_stock: float) -> str:
    if total_stock <= 0:
        return "Out of Stock"
    elif total_stock <= min_stock:
        return "Low Stock"
    elif total_stock > max_stock:
        return "Overstock"
    else:
        return "In Stock"

@router.get("", response_model=PaginatedResponse[ProductResponse])
def list_products(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    brand_id: Optional[str] = None,
    stock_status: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.organization_id == tenant.id)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Product.name_en.ilike(search_fmt),
                Product.name_kh.ilike(search_fmt),
                Product.sku.ilike(search_fmt),
                Product.barcode.ilike(search_fmt)
            )
        )

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if brand_id:
        query = query.filter(Product.brand_id == brand_id)

    total = query.count()
    products = query.order_by(Product.created_at.desc()).offset((page - 1) * size).limit(size).all()

    items = []
    for p in products:
        # Sum stock across warehouses for this tenant
        stock_query = db.query(func.coalesce(func.sum(WarehouseStock.quantity), 0.0)).filter(
            WarehouseStock.product_id == p.id,
            WarehouseStock.organization_id == tenant.id
        )
        if warehouse_id:
            stock_query = stock_query.filter(WarehouseStock.warehouse_id == warehouse_id)
        
        current_stock = float(stock_query.scalar() or 0.0)
        status_calc = compute_product_stock_status(current_stock, p.min_stock, p.max_stock)

        if stock_status and stock_status != "All" and status_calc != stock_status:
            continue

        p_dict = ProductResponse.model_validate(p)
        p_dict.total_stock = current_stock
        p_dict.stock_status = status_calc
        items.append(p_dict)

    total_pages = (total + size - 1) // size if total > 0 else 1
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages
    }

@router.post("", response_model=ProductResponse)
def create_product(
    data: ProductCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    # Enforce plan limits!
    check_plan_limit(db, tenant.id, "products")

    # Check unique SKU in tenant
    existing = db.query(Product).filter(Product.organization_id == tenant.id, Product.sku == data.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with SKU '{data.sku}' already exists in your business")

    product = Product(
        organization_id=tenant.id,
        sku=data.sku,
        barcode=data.barcode,
        name_en=data.name_en,
        name_kh=data.name_kh,
        description=data.description,
        category_id=data.category_id,
        brand_id=data.brand_id,
        unit_id=data.unit_id,
        supplier_id=data.supplier_id,
        cost_price=data.cost_price,
        selling_price=data.selling_price,
        min_stock=data.min_stock,
        max_stock=data.max_stock,
        image_url=data.image_url,
        status=data.status
    )
    db.add(product)
    db.flush()

    # Create Variants if any
    if data.variants:
        for v in data.variants:
            variant = ProductVariant(
                organization_id=tenant.id,
                product_id=product.id,
                sku=v.sku,
                barcode=v.barcode,
                variant_name=v.variant_name,
                size=v.size,
                color=v.color,
                cost_price=v.cost_price or data.cost_price,
                selling_price=v.selling_price or data.selling_price,
                status=v.status
            )
            db.add(variant)

    # Initial Opening Stock if provided
    if data.initial_stock and data.initial_stock > 0:
        # Determine warehouse (use provided or default)
        wh_id = data.initial_warehouse_id
        if not wh_id:
            default_wh = db.query(Warehouse).filter(Warehouse.organization_id == tenant.id, Warehouse.is_default == True).first()
            if not default_wh:
                default_wh = db.query(Warehouse).filter(Warehouse.organization_id == tenant.id).first()
            wh_id = default_wh.id if default_wh else None

        if wh_id:
            stock = WarehouseStock(
                organization_id=tenant.id,
                warehouse_id=wh_id,
                product_id=product.id,
                quantity=data.initial_stock,
                reserved_quantity=0.0
            )
            db.add(stock)

            # Record auditable stock movement
            movement = StockMovement(
                organization_id=tenant.id,
                product_id=product.id,
                warehouse_id=wh_id,
                movement_type="Opening Stock",
                quantity=data.initial_stock,
                previous_quantity=0.0,
                new_quantity=data.initial_stock,
                reference_type="InitialSetup",
                reference_id=product.id,
                reason="Initial product creation opening stock",
                user_id=current_user.id
            )
            db.add(movement)

    log_audit_event(
        db,
        organization_id=tenant.id,
        action="CREATE_PRODUCT",
        entity="Product",
        entity_id=product.id,
        user=current_user,
        new_value=f"Created product {product.name_en} ({product.sku})"
    )
    db.commit()
    db.refresh(product)

    res = ProductResponse.model_validate(product)
    res.total_stock = data.initial_stock or 0.0
    res.stock_status = compute_product_stock_status(res.total_stock, product.min_stock, product.max_stock)
    return res

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: str,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id, Product.organization_id == tenant.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    total_stock = float(db.query(func.coalesce(func.sum(WarehouseStock.quantity), 0.0)).filter(
        WarehouseStock.product_id == product.id,
        WarehouseStock.organization_id == tenant.id
    ).scalar() or 0.0)

    res = ProductResponse.model_validate(product)
    res.total_stock = total_stock
    res.stock_status = compute_product_stock_status(total_stock, product.min_stock, product.max_stock)
    return res

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    data: ProductUpdate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id, Product.organization_id == tenant.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(product, key, value)

    log_audit_event(
        db,
        organization_id=tenant.id,
        action="UPDATE_PRODUCT",
        entity="Product",
        entity_id=product.id,
        user=current_user,
        new_value=f"Updated product {product.name_en}"
    )
    db.commit()
    db.refresh(product)

    total_stock = float(db.query(func.coalesce(func.sum(WarehouseStock.quantity), 0.0)).filter(
        WarehouseStock.product_id == product.id,
        WarehouseStock.organization_id == tenant.id
    ).scalar() or 0.0)

    res = ProductResponse.model_validate(product)
    res.total_stock = total_stock
    res.stock_status = compute_product_stock_status(total_stock, product.min_stock, product.max_stock)
    return res

@router.delete("/{product_id}")
def delete_product(
    product_id: str,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin"])),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id, Product.organization_id == tenant.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.status = "inactive"
    log_audit_event(
        db,
        organization_id=tenant.id,
        action="DELETE_PRODUCT",
        entity="Product",
        entity_id=product.id,
        user=current_user
    )
    db.commit()
    return {"message": "Product deactivated successfully"}

@router.post("/import-csv")
async def import_products_csv(
    file: UploadFile = File(...),
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))
    
    success_count = 0
    failed_rows = []

    default_wh = db.query(Warehouse).filter(Warehouse.organization_id == tenant.id, Warehouse.is_default == True).first()

    for idx, row in enumerate(reader, start=2):
        sku = row.get("SKU") or row.get("sku")
        name = row.get("Product Name") or row.get("name") or row.get("name_en")
        cost = float(row.get("Cost") or row.get("cost_price") or 0.0)
        price = float(row.get("Selling Price") or row.get("selling_price") or 0.0)
        stock_qty = float(row.get("Stock") or row.get("quantity") or 0.0)
        barcode = row.get("Barcode") or row.get("barcode")

        if not sku or not name:
            failed_rows.append({"row": idx, "reason": "Missing required SKU or Product Name"})
            continue

        existing = db.query(Product).filter(Product.organization_id == tenant.id, Product.sku == sku).first()
        if existing:
            failed_rows.append({"row": idx, "sku": sku, "reason": "SKU already exists in tenant"})
            continue

        try:
            check_plan_limit(db, tenant.id, "products")
            new_p = Product(
                organization_id=tenant.id,
                sku=sku,
                barcode=barcode,
                name_en=name,
                cost_price=cost,
                selling_price=price,
                status="active"
            )
            db.add(new_p)
            db.flush()

            if stock_qty > 0 and default_wh:
                stk = WarehouseStock(
                    organization_id=tenant.id,
                    warehouse_id=default_wh.id,
                    product_id=new_p.id,
                    quantity=stock_qty,
                    reserved_quantity=0.0
                )
                db.add(stk)

            success_count += 1
        except Exception as e:
            failed_rows.append({"row": idx, "sku": sku, "reason": str(e)})

    db.commit()
    return {
        "success_count": success_count,
        "failed_count": len(failed_rows),
        "failed_rows": failed_rows
    }

@router.get("/export/csv")
def export_products_csv(
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(Product.organization_id == tenant.id).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["SKU", "Barcode", "Name (EN)", "Name (KH)", "Cost Price (USD)", "Selling Price (USD)", "Total Stock", "Status"])
    
    for p in products:
        stock = db.query(func.coalesce(func.sum(WarehouseStock.quantity), 0.0)).filter(
            WarehouseStock.product_id == p.id,
            WarehouseStock.organization_id == tenant.id
        ).scalar() or 0.0
        writer.writerow([p.sku, p.barcode or "", p.name_en, p.name_kh or "", p.cost_price, p.selling_price, stock, p.status])

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=products_{tenant.code}.csv"}
    )
