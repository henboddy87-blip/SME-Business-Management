import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.organization import Organization
from app.models.product import Product
from app.models.warehouse import Warehouse, WarehouseStock

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_and_auth():
    # Login as Business Owner of Khmer Style Fashion
    resp = client.post("/api/v1/auth/login", json={
        "email": "owner@khmerstyle.com",
        "password": "Password@123"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "owner@khmerstyle.com"

    # Test /me endpoint with token
    token = data["access_token"]
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "owner@khmerstyle.com"

def test_multi_tenant_isolation():
    """
    CRITICAL SAAS REQUIREMENT:
    Business A (owner@khmerstyle.com) must NEVER be able to see or access Business B's (Angkor Artisans Cafe) products!
    """
    # 1. Login as Business A
    resp_a = client.post("/api/v1/auth/login", json={
        "email": "owner@khmerstyle.com",
        "password": "Password@123"
    })
    token_a = resp_a.json()["access_token"]

    # 2. Login as Business B
    resp_b = client.post("/api/v1/auth/login", json={
        "email": "cafe_owner@angkorcafe.com",
        "password": "Password@123"
    })
    token_b = resp_b.json()["access_token"]

    # 3. Fetch products as Business A
    prods_a = client.get("/api/v1/products", headers={"Authorization": f"Bearer {token_a}"}).json()
    skus_a = [p["sku"] for p in prods_a["items"]]

    # Business A must see its own fashion items
    assert "KS-TSHIRT-01" in skus_a
    # Business A must NOT see Business B's coffee product!
    assert "COFFEE-ROBUSTA-KG" not in skus_a

    # 4. Fetch products as Business B
    prods_b = client.get("/api/v1/products", headers={"Authorization": f"Bearer {token_b}"}).json()
    skus_b = [p["sku"] for p in prods_b["items"]]

    # Business B must see its coffee item
    assert "COFFEE-ROBUSTA-KG" in skus_b
    # Business B must NOT see Business A's fashion items!
    assert "KS-TSHIRT-01" not in skus_b

    # 5. Direct ID access test: Business A trying to get Business B's product by ID must return 404!
    db = SessionLocal()
    cafe_prod = db.query(Product).filter(Product.sku == "COFFEE-ROBUSTA-KG").first()
    db.close()

    assert cafe_prod is not None
    cross_access_resp = client.get(f"/api/v1/products/{cafe_prod.id}", headers={"Authorization": f"Bearer {token_a}"})
    assert cross_access_resp.status_code == 404, "Tenant A was able to access Tenant B's product by ID!"

def test_pos_sale_inventory_deduction():
    """
    Test that making a sale automatically and atomically:
    1. Decreases stock
    2. Records a stock movement
    3. Generates an invoice and payment
    """
    resp = client.post("/api/v1/auth/login", json={
        "email": "sales@khmerstyle.com",
        "password": "Password@123"
    })
    token = resp.json()["access_token"]

    db = SessionLocal()
    product = db.query(Product).filter(Product.sku == "KS-POLO-02").first()
    warehouse = db.query(Warehouse).filter(Warehouse.code == "WH-PP01").first()
    initial_stock_record = db.query(WarehouseStock).filter(
        WarehouseStock.product_id == product.id,
        WarehouseStock.warehouse_id == warehouse.id
    ).first()
    initial_qty = initial_stock_record.quantity
    db.close()

    # Complete a sale of 2 units
    sale_payload = {
        "warehouse_id": warehouse.id,
        "payment_method": "Cash",
        "currency": "USD",
        "paid_amount": 37.00,
        "items": [
            {
                "product_id": product.id,
                "quantity": 2.0,
                "unit_price": 18.50,
                "discount": 0.0
            }
        ]
    }

    sale_res = client.post("/api/v1/sales", json=sale_payload, headers={"Authorization": f"Bearer {token}"})
    assert sale_res.status_code == 200
    sale_data = sale_res.json()
    assert sale_data["payment_status"] == "Paid"
    assert len(sale_data["invoice_number"]) > 0

    # Verify database stock decreased by exactly 2
    db = SessionLocal()
    updated_stock = db.query(WarehouseStock).filter(
        WarehouseStock.product_id == product.id,
        WarehouseStock.warehouse_id == warehouse.id
    ).first()
    assert updated_stock.quantity == initial_qty - 2.0
    db.close()

def test_stock_adjustment():
    resp = client.post("/api/v1/auth/login", json={
        "email": "inventory@khmerstyle.com",
        "password": "Password@123"
    })
    token = resp.json()["access_token"]

    db = SessionLocal()
    product = db.query(Product).filter(Product.sku == "KS-CAP-09").first()
    warehouse = db.query(Warehouse).filter(Warehouse.code == "WH-PP01").first()
    db.close()

    adj_res = client.post("/api/v1/inventory/adjust", json={
        "warehouse_id": warehouse.id,
        "product_id": product.id,
        "quantity_adjusted": -2.0,
        "reason": "Damaged during showroom display"
    }, headers={"Authorization": f"Bearer {token}"})

    assert adj_res.status_code == 200
    assert adj_res.json()["quantity_adjusted"] == -2.0

def test_purchase_direct_receiving_inventory_addition():
    """
    Test Phase 5: Receiving inventory from direct purchase atomically increases stock.
    """
    resp = client.post("/api/v1/auth/login", json={
        "email": "owner@khmerstyle.com",
        "password": "Password@123"
    })
    token = resp.json()["access_token"]

    db = SessionLocal()
    product = db.query(Product).filter(Product.sku == "KS-SANDAL-05").first()
    warehouse = db.query(Warehouse).filter(Warehouse.code == "WH-PP01").first()
    from app.models.partner import Supplier
    supplier = db.query(Supplier).filter(Supplier.organization_id == warehouse.organization_id).first()
    
    stk_record = db.query(WarehouseStock).filter(
        WarehouseStock.product_id == product.id,
        WarehouseStock.warehouse_id == warehouse.id
    ).first()
    initial_qty = stk_record.quantity if stk_record else 0.0
    db.close()

    purchase_payload = {
        "supplier_id": supplier.id,
        "warehouse_id": warehouse.id,
        "payment_method": "Cash",
        "discount": 0.0,
        "tax": 0.0,
        "paid_amount": 100.0,
        "notes": "Incoming direct consignment",
        "items": [
            {
                "product_id": product.id,
                "quantity": 10.0,
                "unit_cost": 10.0
            }
        ]
    }

    p_res = client.post("/api/v1/purchases", json=purchase_payload, headers={"Authorization": f"Bearer {token}"})
    assert p_res.status_code == 200
    p_data = p_res.json()
    assert p_data["status"] == "Received"

    # Verify inventory was immediately credited +10
    db = SessionLocal()
    updated_stk = db.query(WarehouseStock).filter(
        WarehouseStock.product_id == product.id,
        WarehouseStock.warehouse_id == warehouse.id
    ).first()
    assert updated_stk.quantity == initial_qty + 10.0
    db.close()

def test_finance_expenses_and_cash_flow():
    """
    Test Phase 7: Recording operating expenses and verifying cash flow summary.
    """
    resp = client.post("/api/v1/auth/login", json={
        "email": "accountant@khmerstyle.com",
        "password": "Password@123"
    })
    token = resp.json()["access_token"]

    # 1. Fetch expense categories
    cats_res = client.get("/api/v1/expenses/categories", headers={"Authorization": f"Bearer {token}"})
    assert cats_res.status_code == 200
    cats = cats_res.json()
    cat_id = cats[0]["id"] if cats else None

    # 2. Record expense
    exp_payload = {
        "category_id": cat_id,
        "amount_usd": 45.0,
        "amount_khr": 184500.0,
        "currency": "USD",
        "payment_method": "Cash",
        "date": "2026-09-28",
        "description": "Store electricity monthly recharge"
    }
    exp_res = client.post("/api/v1/expenses", json=exp_payload, headers={"Authorization": f"Bearer {token}"})
    assert exp_res.status_code == 200
    assert exp_res.json()["amount_usd"] == 45.0

    # 3. Verify cash flow reflects expenses
    cf_res = client.get("/api/v1/finance/cash-flow", headers={"Authorization": f"Bearer {token}"})
    assert cf_res.status_code == 200
    cf_data = cf_res.json()
    assert cf_data["total_outflow_usd"] >= 45.0

def test_hr_employee_attendance_and_payroll():
    """
    Test Phase 8: HR employee list, recording attendance, and payroll preview.
    """
    resp = client.post("/api/v1/auth/login", json={
        "email": "owner@khmerstyle.com",
        "password": "Password@123"
    })
    token = resp.json()["access_token"]

    # 1. List employees
    emps_res = client.get("/api/v1/employees", headers={"Authorization": f"Bearer {token}"})
    assert emps_res.status_code == 200
    emps = emps_res.json()
    assert len(emps) > 0
    test_emp = emps[0]

    # 2. Record attendance
    att_payload = {
        "employee_id": test_emp["id"],
        "date": "2026-09-28",
        "check_in": "08:00",
        "check_out": "17:00",
        "status": "Present",
        "notes": "On-time arrival"
    }
    att_res = client.post("/api/v1/attendance", json=att_payload, headers={"Authorization": f"Bearer {token}"})
    assert att_res.status_code == 200
    assert att_res.json()["status"] == "Present"

    # 3. Payroll preview
    pay_res = client.get("/api/v1/attendance/payroll-preview", headers={"Authorization": f"Bearer {token}"})
    assert pay_res.status_code == 200
    pay_data = pay_res.json()
    assert len(pay_data) > 0
    assert pay_data[0]["net_salary"] > 0

def test_superadmin_platform_controls():
    """
    Test Phase 10: Superadmin platform dashboard and tenant listing.
    """
    resp = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "Admin@123456"
    })
    token = resp.json()["access_token"]

    # 1. Dashboard
    dash_res = client.get("/api/v1/superadmin/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert dash_res.status_code == 200
    assert dash_res.json()["total_businesses"] >= 2

    # 2. List businesses
    orgs_res = client.get("/api/v1/superadmin/businesses", headers={"Authorization": f"Bearer {token}"})
    assert orgs_res.status_code == 200
    org_list = orgs_res.json()
    assert len(org_list) >= 2

