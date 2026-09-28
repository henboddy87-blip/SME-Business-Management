export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  organization_id?: string;
  is_super_admin: boolean;
  is_active: boolean;
  roles: Role[];
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
}

export interface OrganizationSettings {
  tax_number?: string;
  default_tax_rate: number;
  tax_enabled: boolean;
  invoice_prefix: string;
  quotation_prefix: string;
  po_prefix: string;
  invoice_footer_en?: string;
  invoice_footer_kh?: string;
  khr_exchange_rate: number;
  enable_khqr: boolean;
  khqr_merchant_name?: string;
  khqr_merchant_city?: string;
  khqr_merchant_id?: string;
  telegram_notifications_enabled: boolean;
  default_warehouse_id?: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  business_type: string;
  owner_name: string;
  phone?: string;
  email?: string;
  address?: string;
  province: string;
  district?: string;
  logo_url?: string;
  currency: string;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  settings?: OrganizationSettings;
}

export interface ProductVariant {
  id?: string;
  sku: string;
  barcode?: string;
  variant_name: string;
  size?: string;
  color?: string;
  cost_price?: number;
  selling_price?: number;
  status?: string;
}

export interface Product {
  id: string;
  organization_id: string;
  sku: string;
  barcode?: string;
  name_en: string;
  name_kh?: string;
  description?: string;
  category_id?: string;
  brand_id?: string;
  unit_id?: string;
  supplier_id?: string;
  cost_price: number;
  selling_price: number;
  min_stock: number;
  max_stock: number;
  image_url?: string;
  status: string;
  total_stock: number;
  stock_status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstock';
  category?: { id: string; name_en: string; name_kh?: string };
  brand?: { id: string; name: string };
  unit?: { id: string; name_en: string; short_code: string };
  variants: ProductVariant[];
  created_at: string;
}

export interface Category {
  id: string;
  name_en: string;
  name_kh?: string;
  parent_id?: string;
  description?: string;
  status: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  province: string;
  phone?: string;
  manager_name?: string;
  is_default: boolean;
  status: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  variant_id?: string;
  warehouse_id: string;
  movement_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reference_type?: string;
  reference_id?: string;
  reason?: string;
  user_id?: string;
  product_name?: string;
  product_sku?: string;
  warehouse_name?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  province: string;
  customer_type: string;
  credit_limit: number;
  outstanding_balance: number;
  total_sales_count: number;
  total_spent_usd: number;
  status: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  province: string;
  payment_terms: string;
  outstanding_balance: number;
  total_purchases_count: number;
  total_spent_usd: number;
  status: string;
}

export interface SaleItem {
  id?: string;
  product_id: string;
  variant_id?: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  discount: number;
  subtotal: number;
  product?: { id: string; name_en: string; name_kh?: string; sku?: string };
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name?: string;
  customer?: { id: string; name: string; phone?: string; email?: string; outstanding_balance?: number };
  warehouse_id: string;
  warehouse_name?: string;
  salesperson_id: string;
  salesperson_name?: string;
  subtotal: number;
  discount_rate: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount_usd: number;
  total_amount_khr: number;
  total_amount: number;
  currency: string;
  exchange_rate: number;
  payment_method: string;
  payment_status: string;
  paid_amount_usd: number;
  paid_amount: number;
  change_amount_usd: number;
  status: string;
  notes?: string;
  created_at: string;
  items: SaleItem[];
}

export interface PurchaseOrderItem {
  id?: string;
  product_id: string;
  variant_id?: string;
  product_name?: string;
  quantity: number;
  received_quantity: number;
  unit_cost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name?: string;
  warehouse_id: string;
  warehouse_name?: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  expected_delivery_date?: string;
  notes?: string;
  created_at: string;
  items: PurchaseOrderItem[];
}

export interface Purchase {
  id: string;
  purchase_number: string;
  po_id?: string;
  supplier_id: string;
  supplier_name?: string;
  warehouse_id: string;
  warehouse_name?: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid_amount: number;
  payment_status: string;
  payment_method: string;
  notes?: string;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name_en: string;
  name_kh?: string;
  description?: string;
}

export interface Expense {
  id: string;
  expense_number: string;
  category_id: string;
  category_name?: string;
  amount_usd: number;
  amount_khr: number;
  currency: string;
  payment_method: string;
  date: string;
  description?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  payment_number: string;
  reference_type: string;
  reference_id?: string;
  customer_name?: string;
  supplier_name?: string;
  amount_usd: number;
  amount_khr: number;
  currency: string;
  payment_method: string;
  status: string;
  payment_date: string;
}

export interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  gender: string;
  phone?: string;
  email?: string;
  address?: string;
  province: string;
  department_id?: string;
  department_name?: string;
  position_id?: string;
  position_title?: string;
  hire_date?: string;
  salary: number;
  status: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  employee_name?: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: string;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason?: string;
  status: string;
  created_at: string;
}

export interface KPICards {
  total_sales_usd: number;
  total_sales_khr: number;
  total_purchases_usd: number;
  gross_profit_usd: number;
  net_profit_usd: number;
  inventory_value_usd: number;
  total_customers: number;
  total_products: number;
  low_stock_products: number;
  outstanding_receivables_usd: number;
  outstanding_payables_usd: number;
  total_expenses_usd: number;
}

export interface BusinessInsight {
  id: string;
  type: 'positive' | 'warning' | 'recommendation' | 'neutral';
  title: string;
  description: string;
  metric?: string;
  action_label?: string;
  action_url?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price_usd: number;
  max_users: number;
  max_products: number;
  max_warehouses: number;
  max_monthly_sales: number;
  features: string;
}
