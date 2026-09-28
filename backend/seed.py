import uuid
from datetime import datetime, date, timedelta, timezone
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.organization import Organization, OrganizationSettings
from app.models.subscription import SubscriptionPlan, Subscription
from app.models.user import User, Role, Permission
from app.models.warehouse import Warehouse, WarehouseStock
from app.models.product import Category, Brand, Unit, Product, ProductVariant
from app.models.partner import Customer, Supplier
from app.models.inventory import StockMovement
from app.models.purchase import Purchase, PurchaseItem
from app.models.sale import Sale, SaleItem
from app.models.invoice import Invoice
from app.models.finance import ExpenseCategory, Expense, Payment
from app.models.hr import Department, Position, Employee, Attendance, LeaveRequest
from app.models.notification import Notification

def seed_database():
    db = SessionLocal()
    try:
        print("🌱 Seeding Cambodian SME SaaS Database...")

        # 1. System Roles
        roles_data = [
            ("Super Admin", "SaaS Platform Super Administrator", True),
            ("Business Owner", "Full control over organization", True),
            ("Business Admin", "Manage most operations", True),
            ("Manager", "Operational management", True),
            ("Sales Staff", "POS, customer sales and invoices", True),
            ("Inventory Staff", "Stock, warehouses and receiving", True),
            ("Accountant", "Finance, expenses, cash flow and reports", True),
            ("HR Staff", "Employees, attendance, and leaves", True),
        ]
        roles_map = {}
        for r_name, r_desc, is_sys in roles_data:
            role = db.query(Role).filter(Role.name == r_name, Role.is_system == True).first()
            if not role:
                role = Role(name=r_name, description=r_desc, is_system=is_sys)
                db.add(role)
                db.flush()
            roles_map[r_name] = role

        # 2. Subscription Plans
        plans_data = [
            ("Free", "free", 0.0, 1, 100, 1, 200, '["pos", "inventory", "basic_reports"]'),
            ("Starter", "starter", 29.0, 5, 1000, 2, 1000, '["pos", "inventory", "purchasing", "finance", "hr", "advanced_reports"]'),
            ("Business", "business", 79.0, 20, 10000, 5, 5000, '["pos", "inventory", "purchasing", "finance", "hr", "analytics", "ai_insights", "khqr", "telegram", "multi_warehouse"]'),
        ]
        plans_map = {}
        for p_name, p_slug, p_price, max_u, max_p, max_w, max_s, feats in plans_data:
            plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == p_slug).first()
            if not plan:
                plan = SubscriptionPlan(
                    name=p_name,
                    slug=p_slug,
                    price_usd=p_price,
                    billing_period="monthly",
                    max_users=max_u,
                    max_products=max_p,
                    max_warehouses=max_w,
                    max_monthly_sales=max_s,
                    features=feats
                )
                db.add(plan)
                db.flush()
            plans_map[p_slug] = plan

        # 3. Super Admin User
        super_admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not super_admin:
            super_admin = User(
                email="admin@example.com",
                hashed_password=get_password_hash("Admin@123456"),
                full_name="Platform Administrator",
                phone="+855 12 999 888",
                is_super_admin=True,
                is_active=True
            )
            super_admin.roles.append(roles_map["Super Admin"])
            db.add(super_admin)

        # 4. Primary Tenant: Khmer Style Fashion
        khmer_org = db.query(Organization).filter(Organization.code == "KH-FASHION").first()
        if not khmer_org:
            khmer_org = Organization(
                name="Khmer Style Fashion",
                code="KH-FASHION",
                business_type="Retail Clothing",
                owner_name="Sokha Chea",
                phone="+855 23 888 777",
                email="owner@khmerstyle.com",
                address="No. 128, Preah Sihanouk Blvd, Boeung Keng Kang I",
                province="Phnom Penh",
                district="Boeung Keng Kang",
                currency="USD",
                is_active=True,
                onboarding_completed=True
            )
            db.add(khmer_org)
            db.flush()

            # Settings
            org_settings = OrganizationSettings(
                organization_id=khmer_org.id,
                tax_number="K001-902348512",
                default_tax_rate=10.0,
                tax_enabled=True,
                invoice_prefix="KSF-",
                quotation_prefix="QUO-",
                po_prefix="PO-",
                invoice_footer_en="Thank you for shopping at Khmer Style Fashion!",
                invoice_footer_kh="សូមអរគុណចំពោះការគាំទ្រ ហាងម៉ូតខ្មែរ!",
                khr_exchange_rate=4100.0,
                enable_khqr=True,
                khqr_merchant_name="Khmer Style Fashion",
                khqr_merchant_city="Phnom Penh",
                khqr_merchant_id="khmer_fashion@acleda",
                telegram_notifications_enabled=True,
                telegram_bot_token="mock_telegram_bot_token",
                telegram_chat_id="mock_chat_id"
            )
            db.add(org_settings)

            # Subscription (Business Plan)
            sub = Subscription(
                organization_id=khmer_org.id,
                plan_id=plans_map["business"].id,
                status="active",
                current_period_start=datetime.now(timezone.utc),
                current_period_end=datetime.now(timezone.utc) + timedelta(days=30)
            )
            db.add(sub)

            # Warehouses
            wh_pp = Warehouse(
                organization_id=khmer_org.id,
                name="Phnom Penh Flagship Warehouse",
                code="WH-PP01",
                address="No. 128, Preah Sihanouk Blvd",
                province="Phnom Penh",
                phone="+855 23 888 778",
                manager_name="Vannak Chan",
                is_default=True,
                status="active"
            )
            wh_sr = Warehouse(
                organization_id=khmer_org.id,
                name="Siem Reap Distribution Hub",
                code="WH-SR02",
                address="Sivutha Blvd, Svay Dangkum",
                province="Siem Reap",
                phone="+855 63 999 555",
                manager_name="Bopha Meas",
                is_default=False,
                status="active"
            )
            db.add_all([wh_pp, wh_sr])
            db.flush()
            org_settings.default_warehouse_id = wh_pp.id

            # Users for Khmer Style Fashion
            users_info = [
                ("owner@khmerstyle.com", "Password@123", "Sokha Chea", "+855 12 111 222", "Business Owner"),
                ("manager@khmerstyle.com", "Password@123", "Vannak Chan", "+855 12 222 333", "Manager"),
                ("sales@khmerstyle.com", "Password@123", "Dara Nimol", "+855 12 333 444", "Sales Staff"),
                ("inventory@khmerstyle.com", "Password@123", "Sophea Kim", "+855 12 444 555", "Inventory Staff"),
                ("accountant@khmerstyle.com", "Password@123", "Chanthy Heng", "+855 12 555 666", "Accountant"),
            ]
            khmer_users = {}
            for u_email, u_pwd, u_name, u_phone, u_role in users_info:
                u = User(
                    organization_id=khmer_org.id,
                    email=u_email,
                    hashed_password=get_password_hash(u_pwd),
                    full_name=u_name,
                    phone=u_phone,
                    is_super_admin=False,
                    is_active=True
                )
                u.roles.append(roles_map[u_role])
                db.add(u)
                db.flush()
                khmer_users[u_email] = u

            # Categories
            cat_men = Category(organization_id=khmer_org.id, name_en="Men's Clothing", name_kh="សម្លៀកបំពាក់បុរស")
            cat_women = Category(organization_id=khmer_org.id, name_en="Women's Clothing", name_kh="សម្លៀកបំពាក់នារី")
            cat_shoes = Category(organization_id=khmer_org.id, name_en="Shoes", name_kh="ស្បែកជើង")
            cat_bags = Category(organization_id=khmer_org.id, name_en="Bags", name_kh="កាបូប")
            cat_acc = Category(organization_id=khmer_org.id, name_en="Accessories", name_kh="គ្រឿងតុបតែង")
            db.add_all([cat_men, cat_women, cat_shoes, cat_bags, cat_acc])
            db.flush()

            # Brands & Units
            brand_local = Brand(organization_id=khmer_org.id, name="Khmer Heritage Silk")
            brand_urban = Brand(organization_id=khmer_org.id, name="Phnom Penh Urban")
            db.add_all([brand_local, brand_urban])

            unit_pcs = Unit(organization_id=khmer_org.id, name_en="Piece", name_kh="ដុំ/កំប្លេ", short_code="pcs")
            unit_pair = Unit(organization_id=khmer_org.id, name_en="Pair", name_kh="គូ", short_code="pr")
            db.add_all([unit_pcs, unit_pair])
            db.flush()

            # Suppliers
            sup1 = Supplier(
                organization_id=khmer_org.id,
                name="Cambodian Textile Crafts Co., Ltd.",
                contact_person="Oknha Rithy",
                phone="+855 23 456 789",
                email="orders@cambodiatextiles.com",
                address="Veng Sreng Blvd, Khan Meanchey",
                province="Phnom Penh",
                payment_terms="Net 30",
                outstanding_balance=0.0
            )
            sup2 = Supplier(
                organization_id=khmer_org.id,
                name="Angkor Leathercraft Supplies",
                contact_person="Srey Leak",
                phone="+855 63 123 456",
                email="contact@angkorleather.kh",
                address="Road 6, Siem Reap",
                province="Siem Reap",
                payment_terms="Net 15",
                outstanding_balance=0.0
            )
            db.add_all([sup1, sup2])
            db.flush()

            # Customers
            cust1 = Customer(
                organization_id=khmer_org.id,
                name="Socheat Meng",
                phone="+855 12 777 888",
                email="socheat.meng@gmail.com",
                province="Phnom Penh",
                customer_type="VIP",
                credit_limit=500.0,
                outstanding_balance=45.0
            )
            cust2 = Customer(
                organization_id=khmer_org.id,
                name="Dany Pich",
                phone="+855 98 666 555",
                email="dany.pich@yahoo.com",
                province="Siem Reap",
                customer_type="Retail",
                credit_limit=200.0,
                outstanding_balance=0.0
            )
            cust3 = Customer(
                organization_id=khmer_org.id,
                name="Borey Retail Mart",
                phone="+855 88 444 333",
                email="purchasing@boreymart.kh",
                province="Battambang",
                customer_type="Wholesale",
                credit_limit=2000.0,
                outstanding_balance=250.0
            )
            db.add_all([cust1, cust2, cust3])
            db.flush()

            # Products (Realistic Cambodian SME fashion items)
            products_data = [
                ("KS-TSHIRT-01", "885901234001", "Premium Cotton T-Shirt", "អាវយឺតកប្បាសប្រណិត", cat_men.id, brand_urban.id, unit_pcs.id, sup1.id, 6.50, 14.00, 15.0, 150.0, 85.0),
                ("KS-POLO-02", "885901234002", "Smart Casual Polo Shirt", "អាវប៉ូឡូស្អាតសមរម្យ", cat_men.id, brand_urban.id, unit_pcs.id, sup1.id, 9.00, 18.50, 10.0, 100.0, 42.0),
                ("KS-JEANS-03", "885901234003", "Slim Fit Denim Jeans", "ខោខូវប៊យយឺតសមរម្យ", cat_men.id, brand_urban.id, unit_pcs.id, sup1.id, 14.00, 29.00, 10.0, 80.0, 36.0),
                ("KS-SNEAKER-04", "885901234004", "Phnom Penh Street Sneakers", "ស្បែកជើងប៉ាតាទំនើប", cat_shoes.id, brand_urban.id, unit_pair.id, sup2.id, 18.00, 38.00, 5.0, 50.0, 24.0),
                ("KS-SANDAL-05", "885901234005", "Handcrafted Leather Sandals", "ស្បែកជើងសង្រែកស្បែកសុទ្ធ", cat_shoes.id, brand_urban.id, unit_pair.id, sup2.id, 8.50, 19.50, 8.0, 60.0, 18.0),
                ("KS-BACKPACK-06", "885901234006", "Waterproof Canvas Backpack", "កាតាបស្ពាយការពារជោកទឹក", cat_bags.id, brand_urban.id, unit_pcs.id, sup2.id, 12.00, 26.00, 5.0, 40.0, 15.0),
                ("KS-HANDBAG-07", "885901234007", "Khmer Silk Tote Handbag", "កាបូបយួរដៃសូត្រខ្មែរ", cat_bags.id, brand_local.id, unit_pcs.id, sup1.id, 16.00, 35.00, 4.0, 30.0, 3.0), # Low stock!
                ("KS-BELT-08", "885901234008", "Genuine Leather Belt", "ខ្សែក្រវាត់ស្បែកគោសុទ្ធ", cat_acc.id, brand_urban.id, unit_pcs.id, sup2.id, 5.50, 12.50, 10.0, 80.0, 28.0),
                ("KS-CAP-09", "885901234009", "Embroidered Angkor Cap", "មួកប៉ាក់រូបអង្គរវត្ត", cat_acc.id, brand_local.id, unit_pcs.id, sup1.id, 3.50, 8.50, 10.0, 100.0, 50.0),
            ]

            created_products = []
            for sku, bcode, n_en, n_kh, c_id, b_id, u_id, s_id, cost, sell, min_s, max_s, init_qty in products_data:
                prod = Product(
                    organization_id=khmer_org.id,
                    sku=sku,
                    barcode=bcode,
                    name_en=n_en,
                    name_kh=n_kh,
                    category_id=c_id,
                    brand_id=b_id,
                    unit_id=u_id,
                    supplier_id=s_id,
                    cost_price=cost,
                    selling_price=sell,
                    min_stock=min_s,
                    max_stock=max_s,
                    status="active"
                )
                db.add(prod)
                db.flush()

                # Stock in Phnom Penh warehouse
                db.add(WarehouseStock(
                    organization_id=khmer_org.id,
                    warehouse_id=wh_pp.id,
                    product_id=prod.id,
                    quantity=init_qty,
                    reserved_quantity=0.0
                ))

                # Stock Movement
                db.add(StockMovement(
                    organization_id=khmer_org.id,
                    product_id=prod.id,
                    warehouse_id=wh_pp.id,
                    movement_type="Opening Stock",
                    quantity=init_qty,
                    previous_quantity=0.0,
                    new_quantity=init_qty,
                    reference_type="InitialSetup",
                    reference_id=prod.id,
                    reason="Initial business setup stock",
                    user_id=khmer_users["owner@khmerstyle.com"].id
                ))

                created_products.append(prod)

            # Variants for T-Shirt
            tshirt_p = created_products[0]
            v1 = ProductVariant(organization_id=khmer_org.id, product_id=tshirt_p.id, sku="KS-TSHIRT-M-BLK", variant_name="M / Black", size="M", color="Black", cost_price=6.50, selling_price=14.00)
            v2 = ProductVariant(organization_id=khmer_org.id, product_id=tshirt_p.id, sku="KS-TSHIRT-L-BLK", variant_name="L / Black", size="L", color="Black", cost_price=6.50, selling_price=14.00)
            v3 = ProductVariant(organization_id=khmer_org.id, product_id=tshirt_p.id, sku="KS-TSHIRT-M-WHT", variant_name="M / White", size="M", color="White", cost_price=6.50, selling_price=14.00)
            db.add_all([v1, v2, v3])

            # Sample Direct Purchase
            pur1 = Purchase(
                organization_id=khmer_org.id,
                purchase_number="PUR-2026-001",
                supplier_id=sup1.id,
                warehouse_id=wh_pp.id,
                status="Received",
                subtotal=520.0,
                discount=20.0,
                tax=0.0,
                total=500.0,
                paid_amount=500.0,
                payment_status="Paid",
                payment_method="Bank Transfer",
                notes="Seasonal restock for Khmer New Year season",
                created_by=khmer_users["inventory@khmerstyle.com"].id
            )
            db.add(pur1)

            # Sample Sales
            sale1 = Sale(
                organization_id=khmer_org.id,
                invoice_number="KSF-260901-001",
                customer_id=cust1.id,
                warehouse_id=wh_pp.id,
                salesperson_id=khmer_users["sales@khmerstyle.com"].id,
                subtotal=70.50,
                discount_rate=0.0,
                discount_amount=0.0,
                tax_rate=10.0,
                tax_amount=7.05,
                total_amount_usd=77.55,
                total_amount_khr=77.55 * 4100.0,
                currency="USD",
                exchange_rate=4100.0,
                payment_method="KHQR",
                payment_status="Paid",
                paid_amount_usd=77.55,
                change_amount_usd=0.0,
                status="Completed",
                notes="Paid via Bakong KHQR"
            )
            db.add(sale1)
            db.flush()

            # Sale Items
            si1 = SaleItem(organization_id=khmer_org.id, sale_id=sale1.id, product_id=created_products[0].id, product_name="Premium Cotton T-Shirt", sku="KS-TSHIRT-01", quantity=2, unit_price=14.00, unit_cost=6.50, discount=0.0, subtotal=28.00)
            si2 = SaleItem(organization_id=khmer_org.id, sale_id=sale1.id, product_id=created_products[2].id, product_name="Slim Fit Denim Jeans", sku="KS-JEANS-03", quantity=1, unit_price=29.00, unit_cost=14.00, discount=0.0, subtotal=29.00)
            si3 = SaleItem(organization_id=khmer_org.id, sale_id=sale1.id, product_id=created_products[7].id, product_name="Genuine Leather Belt", sku="KS-BELT-08", quantity=1, unit_price=12.50, unit_cost=5.50, discount=0.0, subtotal=12.50)
            db.add_all([si1, si2, si3])

            inv1 = Invoice(
                organization_id=khmer_org.id,
                invoice_number=sale1.invoice_number,
                sale_id=sale1.id,
                customer_id=cust1.id,
                issue_date=datetime.now(timezone.utc),
                subtotal=70.50,
                tax=7.05,
                discount=0.0,
                total=77.55,
                paid_amount=77.55,
                status="Paid"
            )
            db.add(inv1)

            # Expense Categories & Expenses
            exp_cat_rent = ExpenseCategory(organization_id=khmer_org.id, name_en="Shop Rental", name_kh="ថ្លៃជួលទីតាំង")
            exp_cat_util = ExpenseCategory(organization_id=khmer_org.id, name_en="Electricity & Water", name_kh="ថ្លៃទឹក ភ្លើង")
            exp_cat_mkt = ExpenseCategory(organization_id=khmer_org.id, name_en="Social Media Marketing", name_kh="ការផ្សាយពាណិជ្ជកម្ម")
            db.add_all([exp_cat_rent, exp_cat_util, exp_cat_mkt])
            db.flush()

            exp1 = Expense(
                organization_id=khmer_org.id,
                expense_number="EXP-260901-01",
                category_id=exp_cat_util.id,
                amount_usd=115.0,
                amount_khr=115.0 * 4100.0,
                currency="USD",
                payment_method="Cash",
                date=datetime.now(timezone.utc) - timedelta(days=2),
                description="EDC Electricity Bill for showroom",
                created_by=khmer_users["accountant@khmerstyle.com"].id
            )
            db.add(exp1)

            # HR: Department, Position, Employee, Attendance
            dept_sales = Department(organization_id=khmer_org.id, name="Sales & Merchandising", description="Retail floor and customer assistance")
            dept_ops = Department(organization_id=khmer_org.id, name="Operations & Warehouse", description="Logistics, warehousing, and inventory")
            db.add_all([dept_sales, dept_ops])
            db.flush()

            pos_sales_lead = Position(organization_id=khmer_org.id, department_id=dept_sales.id, title="Senior Sales Lead", base_salary=350.0)
            pos_wh_officer = Position(organization_id=khmer_org.id, department_id=dept_ops.id, title="Inventory Officer", base_salary=300.0)
            db.add_all([pos_sales_lead, pos_wh_officer])
            db.flush()

            emp1 = Employee(
                organization_id=khmer_org.id,
                employee_code="EMP-001",
                first_name="Dara",
                last_name="Nimol",
                gender="Male",
                phone="+855 12 333 444",
                email="dara.sales@khmerstyle.com",
                province="Phnom Penh",
                department_id=dept_sales.id,
                position_id=pos_sales_lead.id,
                salary=350.0,
                status="Active"
            )
            emp2 = Employee(
                organization_id=khmer_org.id,
                employee_code="EMP-002",
                first_name="Sophea",
                last_name="Kim",
                gender="Female",
                phone="+855 12 444 555",
                email="sophea.inv@khmerstyle.com",
                province="Phnom Penh",
                department_id=dept_ops.id,
                position_id=pos_wh_officer.id,
                salary=300.0,
                status="Active"
            )
            db.add_all([emp1, emp2])
            db.flush()

            att1 = Attendance(
                organization_id=khmer_org.id,
                employee_id=emp1.id,
                date=date.today(),
                check_in="08:00 AM",
                check_out="05:05 PM",
                status="Present"
            )
            db.add(att1)

            # Notification
            db.add(Notification(
                organization_id=khmer_org.id,
                title="Khmer Style Fashion Setup Complete",
                message="Welcome to your new Cambodian SME management suite. Products, warehouses, and users are ready.",
                type="system",
                is_read=False,
                link="/dashboard"
            ))

        # 5. Second Tenant: Angkor Artisans Cafe (For rigorous multi-tenancy isolation testing!)
        cafe_org = db.query(Organization).filter(Organization.code == "KH-CAFE").first()
        if not cafe_org:
            cafe_org = Organization(
                name="Angkor Artisans Cafe",
                code="KH-CAFE",
                business_type="Café & Bakery",
                owner_name="Channary Vorn",
                phone="+855 63 777 666",
                email="owner@angkorcafe.com",
                province="Siem Reap",
                currency="USD",
                is_active=True,
                onboarding_completed=True
            )
            db.add(cafe_org)
            db.flush()

            cafe_owner = User(
                organization_id=cafe_org.id,
                email="cafe_owner@angkorcafe.com",
                hashed_password=get_password_hash("Password@123"),
                full_name="Channary Vorn",
                phone="+855 63 777 666",
                is_super_admin=False,
                is_active=True
            )
            cafe_owner.roles.append(roles_map["Business Owner"])
            db.add(cafe_owner)

            cafe_wh = Warehouse(
                organization_id=cafe_org.id,
                name="Angkor Cafe Central Kitchen",
                code="WH-CAFE01",
                province="Siem Reap",
                is_default=True,
                status="active"
            )
            db.add(cafe_wh)
            db.flush()

            cafe_prod = Product(
                organization_id=cafe_org.id,
                sku="COFFEE-ROBUSTA-KG",
                name_en="Mondulkiri Robusta Whole Beans (1kg)",
                name_kh="គ្រាប់កាហ្វេមណ្ឌលគិរី (១គីឡូ)",
                cost_price=4.50,
                selling_price=10.00,
                min_stock=10.0,
                max_stock=100.0,
                status="active"
            )
            db.add(cafe_prod)

        db.commit()
        print("✅ Database seeding completed successfully!")
        print("----------------------------------------------------------------")
        print("Login Credentials:")
        print("Super Admin: admin@example.com / Admin@123456")
        print("Khmer Style Fashion Owner: owner@khmerstyle.com / Password@123")
        print("Khmer Style Fashion Manager: manager@khmerstyle.com / Password@123")
        print("Khmer Style Fashion Sales Staff: sales@khmerstyle.com / Password@123")
        print("Khmer Style Fashion Inventory: inventory@khmerstyle.com / Password@123")
        print("Khmer Style Fashion Accountant: accountant@khmerstyle.com / Password@123")
        print("Angkor Cafe Owner (Tenant B): cafe_owner@angkorcafe.com / Password@123")
        print("----------------------------------------------------------------")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
