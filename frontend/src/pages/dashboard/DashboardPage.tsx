import React, { useState, useEffect } from 'react';
import {
  DollarSign, ShoppingBag, Package, Users, TrendingUp, AlertTriangle,
  CreditCard, ArrowDownRight, Layers, FileSpreadsheet
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid
} from 'recharts';
import { dashboardApi } from '../../api/services';
import { KPICards } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const { formatMoney } = useCurrency();

  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getDashboard(period);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis: KPICards = data.kpis;

  return (
    <div className="space-y-6">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {t('dashboard')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time business performance metrics and executive summaries
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-2xs">
          {['today', 'week', 'month', 'year', 'all'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                period === p
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('totalSales')}
          value={kpis.total_sales_usd}
          isCurrency={true}
          icon={DollarSign}
          color="emerald"
          trend={{ value: '14.2%', isPositive: true }}
          subtitle="Realized sales"
        />
        <StatCard
          title={t('grossProfit')}
          value={kpis.gross_profit_usd}
          isCurrency={true}
          icon={TrendingUp}
          color="emerald"
          trend={{ value: '18.5%', isPositive: true }}
          subtitle="Sales minus COGS"
        />
        <StatCard
          title={t('netProfit')}
          value={kpis.net_profit_usd}
          isCurrency={true}
          icon={TrendingUp}
          color={kpis.net_profit_usd >= 0 ? 'emerald' : 'rose'}
          subtitle="After operating costs"
        />
        <StatCard
          title={t('totalExpenses')}
          value={kpis.total_expenses_usd}
          isCurrency={true}
          icon={ArrowDownRight}
          color="rose"
          subtitle="Operating expenses"
        />
        <StatCard
          title={t('inventoryValuation')}
          value={kpis.inventory_value_usd}
          isCurrency={true}
          icon={Package}
          color="sky"
          subtitle="Total stock valuation"
        />
        <StatCard
          title={t('outstandingReceivables')}
          value={kpis.outstanding_receivables_usd}
          isCurrency={true}
          icon={CreditCard}
          color="amber"
          subtitle="Uncollected customer debt"
        />
        <StatCard
          title={t('totalCustomers')}
          value={kpis.total_customers}
          isCurrency={false}
          icon={Users}
          color="emerald"
          subtitle="Active client accounts"
        />
        <StatCard
          title={t('lowStockAlerts')}
          value={kpis.low_stock_products}
          isCurrency={false}
          icon={AlertTriangle}
          color={kpis.low_stock_products > 0 ? 'amber' : 'emerald'}
          subtitle="Require replenishment"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Purchases Trend Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('salesOverview')}</h3>
              <p className="text-xs text-slate-400">Daily performance comparison (USD)</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.sales_trend}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="purchasesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="sales" name="Sales ($)" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="purchases" name="Purchases ($)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#purchasesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">{t('salesByCategory')}</h3>
          <p className="text-xs text-slate-400 mb-4">Revenue distribution by category</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.category_shares}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="amount"
                  nameKey="category"
                >
                  {data.category_shares.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {data.category_shares.map((c: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{c.category}</span>
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Row: Top Products & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">{t('topSellingProducts')}</h3>
          <p className="text-xs text-slate-400 mb-4">Ranked by gross realized revenue</p>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.top_products.map((p: any, idx: number) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{p.name}</div>
                    <div className="text-[11px] text-slate-400">SKU: {p.sku} | {p.units_sold} sold</div>
                  </div>
                </div>
                <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                  {formatMoney(p.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">{t('paymentBreakdown')}</h3>
          <p className="text-xs text-slate-400 mb-4">Payment volume across Cambodian channels</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.payment_method_shares}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="method" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Total']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="total" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
