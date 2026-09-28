# Cambodian SME Business Management SaaS Platform

An all-in-one, enterprise-grade, multi-tenant SaaS business management and point-of-sale (POS) platform designed specifically for small and medium enterprises (SMEs) across the Kingdom of Cambodia.

---

## 1. Project Overview

The **Cambodian SME SaaS Platform** streamlines end-to-end commercial operations for Cambodian retail shops, fashion boutiques, cafes, electronics stores, and wholesale businesses. It enforces strict **Multi-Tenancy** isolation at the database and application levels, ensuring that no business can ever access another organization's products, sales, customers, suppliers, inventory, or financial ledgers.

### Key Highlights
- **100% Strict Multi-Tenant Isolation**: Automated tenant boundary enforcement on all SQL queries and API routes via authenticated JWT context.
- **Cambodia Business Localization**: Native Khmer / English bilingual UI, dual-currency processing (USD & Cambodian Riel ៛) with live exchange rate conversions, Cambodia's 25 provinces, National Bakong KHQR QR generation, and Telegram notification alerts.
- **Production Architecture**: FastAPI + SQLAlchemy 2.0 backend paired with Vite + React 19 + TypeScript + Tailwind CSS frontend.

---

## 2. Complete Features by Phase

### Phase 1 — Foundation & Core Framework
- Modular Python FastAPI backend with Pydantic V2 schemas and SQLAlchemy 2.0 ORM.
- React 19 + TypeScript + Vite frontend with Tailwind CSS and dark/light mode toggles.
- Standardized `.env` configuration and SQLite database with PostgreSQL migration readiness.

### Phase 2 — Authentication & Access Control
- JWT-based authentication with bcrypt secure password hashing.
- Role-Based Access Control (RBAC): Super Admin, Business Owner, Business Admin, Manager, Sales Staff, Inventory Staff, Accountant, and HR Staff.
- Protected client-side and server-side route guards.

### Phase 3 — Multi-Tenancy & Onboarding
- Independent organization records with dedicated system settings.
- Interactive multi-step Onboarding Wizard: Business details, sector selection, first warehouse creation, initial products, and payment gateway configuration.

### Phase 4 — Core Inventory Management
- Hierarchical product management (English & Khmer names, SKU, Barcode, categories, brands, units, cost vs. selling prices, min/max thresholds).
- Multi-warehouse inventory tracking and stock valuation.
- Comprehensive stock movements ledger (Opening, Sale, Purchase, Adjustment, Transfer, Return, Damaged).
- Stock adjustments with mandatory user and audit reasoning.
- Inter-warehouse stock transfer workflow (Draft, In-Transit, Received).

### Phase 5 — Purchasing & Procurement
- Supplier directory with contact details and outstanding debt balances.
- Purchase Orders (PO) workflow with draft, pending, approval, and itemized receiving.
- Direct purchase receiving that atomically updates warehouse quantities and records payments.

### Phase 6 — Sales & Point of Sale (POS)
- Modern high-speed POS terminal with barcode scanning, instant search, and cart calculations.
- Automated discounts, configurable Cambodian VAT tax (10%), and cash change computation.
- Multiple payment methods: Cash, Bakong KHQR, Bank Transfer, Card.
- Sales history, quotation generation with 1-click invoice conversion, and partial/full sales returns.

### Phase 7 — Finance, Expenses & Cash Flow
- Operating expense management with localized expense categories (Rent, Utilities, Internet, Salary).
- Unified payment transaction ledger for cash inflows and vendor disbursements.
- Real-time Cash Flow statement (Opening balance, Inflows, Outflows, Net flow, and Closing balance).
- Standard GAAP Profit & Loss (P&L) statement: Operating Revenue, Cost of Goods Sold (COGS), Gross Profit, Operating Overhead, and Net Profit.

### Phase 8 — Employees & HR Management
- Employee directory with salary tiers, positions, departments, and province assignments.
- Daily attendance tracking (Present, Late, Absent, Leave) with clock-in/out timestamps.
- Employee leave request submission and manager approval workflow.
- Payroll preview architecture with gross base salary, SME allowances, bonuses, and net pay in USD and KHR.

### Phase 9 — Reports, Analytics & AI Insights
- Centralized Reports Hub: Filterable and printable Sales, Inventory Valuation, Procurement, and Financial reports with 1-click CSV exports.
- Dedicated Analytics Dashboard powered by Recharts (Revenue velocity, sales by category, average order value, customer retention cohorts, dead/dormant stock detection).
- Rule-based Smart SME Business Insights (`ai_insight_service`) providing real-time operational advice.

### Phase 10 — SaaS Management & Platform Administration
- Subscription tiers (Free, Starter, Business) with configurable quotas: max users, max products, max warehouses, and monthly transaction limits.
- Backend `plan_limit_service` preventing quota overages with friendly upgrade prompts.
- Dedicated Super Admin platform portal to inspect all businesses, activate/suspend tenants, and inspect system audit logs.

### Phase 11 — Cambodia Business Localization
- Instant language switching between English and Khmer (ខ្មែរ).
- Dual-currency toggle displaying all balances in USD ($) and Cambodian Riel (៛) at a configurable benchmark (default: 4,100 KHR/USD).
- Cambodia National Bakong KHQR QR-code payload generation and verification architecture.
- Telegram Bot integration dispatching real-time sales receipts and low-stock alerts.

### Phase 12 — Production Quality & Audit Trail
- System-wide immutable Audit Trail capturing user, entity, action, timestamp, and change diffs.
- Notification Center with polling updates and read/unread status.
- Debounced global search across products, sales, customers, suppliers, and purchase orders.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, React Router DOM, TanStack React Query, Recharts, Lucide React, Axios |
| **Backend** | Python 3.10+, FastAPI, Pydantic V2, SQLAlchemy 2.0, Alembic, Passlib/Bcrypt, Python-Jose (JWT) |
| **Database** | SQLite (Default for development) / PostgreSQL compatible |
| **Testing** | Pytest, HTTPX, TestClient |

---

## 4. Folder Structure

```text
POS-Sale-Analytic/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # 27 RESTful API route modules
│   │   ├── core/                # Config, database engine, JWT security
│   │   ├── dependencies/        # Auth, tenant boundary, and RBAC guards
│   │   ├── models/              # 18 SQLAlchemy multi-tenant ORM models
│   │   ├── schemas/             # Pydantic request and response schemas
│   │   └── services/            # Payment, audit, AI insights, telegram, plan limits
│   ├── tests/                   # Pytest test suite with multi-tenant isolation tests
│   ├── seed.py                  # Seed script with Cambodian demo business data
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios HTTP client and typed service endpoints
│   │   ├── components/          # Reusable UI cards, tables, modal dialogs, badges
│   │   ├── context/             # AuthContext, ThemeContext, LanguageContext, CurrencyContext
│   │   ├── i18n/                # English and Khmer translation dictionaries
│   │   ├── layouts/             # DashboardLayout with responsive sidebar and navbar
│   │   ├── pages/               # POS, Sales, Inventory, Purchasing, Finance, HR, Analytics, Settings, SuperAdmin
│   │   ├── types/               # TypeScript interfaces matching backend models
│   │   ├── App.tsx              # Application router with all route definitions
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 5. Getting Started

### Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** and **npm**

---

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment** (optional but recommended):
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux / macOS:
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

5. **Seed Demo Database**:
   Populates the database with demo business **Khmer Style Fashion**, users, catalog, warehouses, stock, and financial records:
   ```bash
   python seed.py
   ```

6. **Start the FastAPI backend**:
   ```bash
   python run.py
   # Or using uvicorn directly:
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   API interactive documentation will be accessible at: `http://localhost:8000/docs`

---

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be live at: `http://localhost:5173`

4. **Build production bundle**:
   ```bash
   npm run build
   ```

---

## 6. Seed Credentials

The demo seed script initializes realistic test accounts:

| Role | Email | Password | Scope / Organization |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@example.com` | `Admin@123456` | Platform-wide Administration |
| **Business Owner** | `owner@khmerstyle.com` | `Password@123` | Khmer Style Fashion (Tenant A) |
| **Manager** | `manager@khmerstyle.com` | `Password@123` | Khmer Style Fashion (Tenant A) |
| **Sales Staff** | `sales@khmerstyle.com` | `Password@123` | Khmer Style Fashion (Tenant A) |
| **Inventory Staff** | `inventory@khmerstyle.com` | `Password@123` | Khmer Style Fashion (Tenant A) |
| **Accountant** | `accountant@khmerstyle.com` | `Password@123` | Khmer Style Fashion (Tenant A) |
| **Second Tenant** | `cafe_owner@angkorcafe.com` | `Password@123` | Angkor Artisans Cafe (Tenant B) |

---

## 7. Running Tests

The test suite validates multi-tenant isolation, atomic inventory deduction, and core business transactions:

```bash
cd backend
python -m pytest tests/
```

Key verified test suites:
- `test_login_and_auth`: Authentication, JWT verification, and user resolution.
- `test_multi_tenant_isolation`: Verifies that Tenant A cannot view or fetch Tenant B's products or records.
- `test_pos_sale_inventory_deduction`: Validates atomic stock reduction, stock movement logs, and invoice creation.
- `test_stock_adjustment`: Auditable stock corrections.
- `test_purchase_direct_receiving_inventory_addition`: Atomic inventory intake upon delivery.
- `test_finance_expenses_and_cash_flow`: Expense records and cash flow balance deductions.
- `test_hr_employee_attendance_and_payroll`: Staff enrollment, attendance, and payroll preview.
- `test_superadmin_platform_controls`: Platform analytics, tenant activation, and global controls.

---

## 8. License

Developed for Cambodian SMEs. All rights reserved.
