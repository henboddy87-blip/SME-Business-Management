import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, ShoppingBag, DollarSign,
  Users, BarChart3, TrendingUp, Settings, ShieldAlert, Shield,
  ChevronDown, ChevronRight, Store, ArrowLeftRight, FileText,
  UserCheck, Receipt, Layers, Warehouse as WhIcon, Truck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const Sidebar: React.FC = () => {
  const { user, tenant } = useAuth();
  const { t } = useLanguage();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sales: true,
    inventory: false,
    purchasing: false,
    finance: false,
    employees: false,
    settings: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
      isActive
        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30 dark:bg-emerald-600'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
    }`;

  const subNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors pl-8 ${
      isActive
        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-semibold'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
    }`;

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen select-none no-print shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200 dark:border-slate-800">
        <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-xl object-contain shadow-xs bg-slate-50 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700" />
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
            SME Platform
          </div>
          <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 truncate max-w-[140px]">
            {tenant?.name || 'Cambodia SaaS'}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Dashboard */}
        <NavLink to="/dashboard" end className={navLinkClass}>
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>{t('dashboard')}</span>
        </NavLink>

        {/* Quick POS Launch Button */}
        <NavLink to="/sales/pos" end className={navLinkClass}>
          <ShoppingCart className="w-4 h-4 shrink-0" />
          <span>{t('pos')}</span>
        </NavLink>

        {/* Sales Section */}
        <div>
          <button
            onClick={() => toggleSection('sales')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4" />
              <span>{t('sales')}</span>
            </div>
            {openSections.sales ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          {openSections.sales && (
            <div className="mt-0.5 space-y-0.5">
              <NavLink to="/sales/history" end className={subNavLinkClass}>{t('salesList')}</NavLink>
              <NavLink to="/customers" end className={subNavLinkClass}>{t('customers')}</NavLink>
              <NavLink to="/sales/returns" end className={subNavLinkClass}>{t('salesReturns')}</NavLink>
              <NavLink to="/sales/quotations" end className={subNavLinkClass}>{t('quotations')}</NavLink>
              <NavLink to="/sales/invoices" end className={subNavLinkClass}>{t('invoices')}</NavLink>
            </div>
          )}
        </div>

        {/* Inventory Section */}
        <div>
          <button
            onClick={() => toggleSection('inventory')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4" />
              <span>{t('inventory')}</span>
            </div>
            {openSections.inventory ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          {openSections.inventory && (
            <div className="mt-0.5 space-y-0.5">
              <NavLink to="/inventory/products" end className={subNavLinkClass}>{t('products')}</NavLink>
              <NavLink to="/inventory/categories" end className={subNavLinkClass}>{t('categories')}</NavLink>
              <NavLink to="/inventory/stock" end className={subNavLinkClass}>{t('stock')}</NavLink>
              <NavLink to="/inventory/movements" end className={subNavLinkClass}>{t('stockMovements')}</NavLink>
              <NavLink to="/inventory/adjustments" end className={subNavLinkClass}>{t('stockAdjustment')}</NavLink>
              <NavLink to="/inventory/transfers" end className={subNavLinkClass}>{t('stockTransfer')}</NavLink>
              <NavLink to="/inventory/warehouses" end className={subNavLinkClass}>{t('warehouses')}</NavLink>
            </div>
          )}
        </div>

        {/* Purchasing Section */}
        <div>
          <button
            onClick={() => toggleSection('purchasing')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4" />
              <span>{t('purchasing')}</span>
            </div>
            {openSections.purchasing ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          {openSections.purchasing && (
            <div className="mt-0.5 space-y-0.5">
              <NavLink to="/purchasing/suppliers" end className={subNavLinkClass}>{t('suppliers')}</NavLink>
              <NavLink to="/purchasing/orders" end className={subNavLinkClass}>{t('purchaseOrders')}</NavLink>
              <NavLink to="/purchasing/history" end className={subNavLinkClass}>{t('purchasesList')}</NavLink>
            </div>
          )}
        </div>

        {/* Finance Section */}
        <div>
          <button
            onClick={() => toggleSection('finance')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-4 h-4" />
              <span>{t('finance')}</span>
            </div>
            {openSections.finance ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          {openSections.finance && (
            <div className="mt-0.5 space-y-0.5">
              <NavLink to="/finance/expenses" end className={subNavLinkClass}>{t('expenses')}</NavLink>
              <NavLink to="/finance/payments" end className={subNavLinkClass}>{t('payments')}</NavLink>
              <NavLink to="/finance/cash-flow" end className={subNavLinkClass}>{t('cashFlow')}</NavLink>
              <NavLink to="/finance/profit-loss" end className={subNavLinkClass}>{t('profitLoss')}</NavLink>
            </div>
          )}
        </div>

        {/* Employees Section */}
        <div>
          <button
            onClick={() => toggleSection('employees')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>{t('employees')}</span>
            </div>
            {openSections.employees ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          {openSections.employees && (
            <div className="mt-0.5 space-y-0.5">
              <NavLink to="/employees/list" end className={subNavLinkClass}>{t('employeeList')}</NavLink>
              <NavLink to="/employees/attendance" end className={subNavLinkClass}>{t('attendance')}</NavLink>
              <NavLink to="/employees/leaves" end className={subNavLinkClass}>{t('leave')}</NavLink>
              <NavLink to="/employees/payroll" end className={subNavLinkClass}>{t('payroll')}</NavLink>
            </div>
          )}
        </div>

        {/* Reports & Analytics */}
        <NavLink to="/reports" end className={navLinkClass}>
          <BarChart3 className="w-4 h-4 shrink-0" />
          <span>{t('reports')}</span>
        </NavLink>

        <NavLink to="/analytics" end className={navLinkClass}>
          <TrendingUp className="w-4 h-4 shrink-0 text-violet-500" />
          <span>{t('analytics')}</span>
        </NavLink>

        {/* Audit Logs */}
        <NavLink to="/audit-logs" end className={navLinkClass}>
          <Shield className="w-4 h-4 shrink-0 text-slate-500" />
          <span>Audit Logs</span>
        </NavLink>

        {/* Settings */}
        <NavLink to="/settings" end className={navLinkClass}>
          <Settings className="w-4 h-4 shrink-0" />
          <span>{t('settings')}</span>
        </NavLink>

        {/* Platform Super Admin (Only for Super Admins) */}
        {user?.is_super_admin && (
          <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800">
            <NavLink
              to="/superadmin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl ${
                  isActive
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                }`
              }
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{t('superAdmin')}</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Tenant Footer Info */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
        <span>Org: {tenant?.code || 'PLATFORM'}</span>
        <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
          {tenant?.currency || 'USD'}
        </span>
      </div>
    </aside>
  );
};
