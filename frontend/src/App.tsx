import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';

import { DashboardLayout } from './layouts/DashboardLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OnboardingWizardPage } from './pages/auth/OnboardingWizardPage';

// Dashboard
import { DashboardPage } from './pages/dashboard/DashboardPage';

// Sales & POS
import { POSPage } from './pages/pos/POSPage';
import { SalesHistoryPage } from './pages/sales/SalesHistoryPage';
import { SalesReturnsPage } from './pages/sales/SalesReturnsPage';
import { QuotationsPage } from './pages/sales/QuotationsPage';
import { InvoicesPage } from './pages/sales/InvoicesPage';
import { CustomersListPage } from './pages/customers/CustomersListPage';

// Inventory
import { ProductsListPage } from './pages/inventory/ProductsListPage';
import { CategoriesPage } from './pages/inventory/CategoriesPage';
import { StockOverviewPage } from './pages/inventory/StockOverviewPage';
import { StockMovementsPage } from './pages/inventory/StockMovementsPage';
import { StockAdjustmentPage } from './pages/inventory/StockAdjustmentPage';
import { StockTransferPage } from './pages/inventory/StockTransferPage';
import { WarehousesPage } from './pages/inventory/WarehousesPage';

// Purchasing
import { SuppliersListPage } from './pages/purchasing/SuppliersListPage';
import { PurchaseOrdersPage } from './pages/purchasing/PurchaseOrdersPage';
import { PurchasesListPage } from './pages/purchasing/PurchasesListPage';

// Finance
import { ExpensesPage } from './pages/finance/ExpensesPage';
import { PaymentsPage } from './pages/finance/PaymentsPage';
import { CashFlowPage } from './pages/finance/CashFlowPage';
import { ProfitLossPage } from './pages/finance/ProfitLossPage';

// Employees & HR
import { EmployeesListPage } from './pages/employees/EmployeesListPage';
import { AttendancePage } from './pages/employees/AttendancePage';
import { LeavesPage } from './pages/employees/LeavesPage';
import { PayrollPage } from './pages/employees/PayrollPage';

// Reports & Analytics
import { ReportsPage } from './pages/reports/ReportsPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';

// Settings & Platform Admin
import { SettingsPage } from './pages/settings/SettingsPage';
import { SuperAdminPage } from './pages/superadmin/SuperAdminPage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <AuthProvider>
                <BrowserRouter>
                <Routes>
                  {/* Public Authentication Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/onboarding" element={<OnboardingWizardPage />} />

                  {/* Protected Main SaaS Routes */}
                  <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />

                    {/* Sales & POS */}
                    <Route path="sales/pos" element={<POSPage />} />
                    <Route path="sales/history" element={<SalesHistoryPage />} />
                    <Route path="sales/returns" element={<SalesReturnsPage />} />
                    <Route path="sales/quotations" element={<QuotationsPage />} />
                    <Route path="sales/invoices" element={<InvoicesPage />} />
                    <Route path="customers" element={<CustomersListPage />} />

                    {/* Inventory */}
                    <Route path="inventory/products" element={<ProductsListPage />} />
                    <Route path="inventory/categories" element={<CategoriesPage />} />
                    <Route path="inventory/stock" element={<StockOverviewPage />} />
                    <Route path="inventory/movements" element={<StockMovementsPage />} />
                    <Route path="inventory/adjustments" element={<StockAdjustmentPage />} />
                    <Route path="inventory/transfers" element={<StockTransferPage />} />
                    <Route path="inventory/warehouses" element={<WarehousesPage />} />

                    {/* Purchasing */}
                    <Route path="purchasing/suppliers" element={<SuppliersListPage />} />
                    <Route path="purchasing/orders" element={<PurchaseOrdersPage />} />
                    <Route path="purchasing/history" element={<PurchasesListPage />} />

                    {/* Finance */}
                    <Route path="finance/expenses" element={<ExpensesPage />} />
                    <Route path="finance/payments" element={<PaymentsPage />} />
                    <Route path="finance/cash-flow" element={<CashFlowPage />} />
                    <Route path="finance/profit-loss" element={<ProfitLossPage />} />

                    {/* Employees & HR */}
                    <Route path="employees/list" element={<EmployeesListPage />} />
                    <Route path="employees/attendance" element={<AttendancePage />} />
                    <Route path="employees/leaves" element={<LeavesPage />} />
                    <Route path="employees/payroll" element={<PayrollPage />} />

                    {/* Reports & Analytics */}
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />

                    {/* Settings & Admin */}
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="superadmin" element={<SuperAdminPage />} />
                    <Route path="audit-logs" element={<AuditLogsPage />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </BrowserRouter>
            </AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
}

export default App;
