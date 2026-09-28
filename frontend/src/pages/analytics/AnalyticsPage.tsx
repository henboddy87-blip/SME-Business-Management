import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Sparkles, AlertTriangle, CheckCircle, ArrowRight,
  ShoppingBag, Users, Layers, DollarSign, Package, RefreshCw
} from 'lucide-react';
import { dashboardApi } from '../../api/services';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const AnalyticsPage: React.FC = () => {
  const { formatMoney } = useCurrency();
  const { t } = useLanguage();

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pieData = analytics?.category_shares?.map((c: any) => ({
    name: c.category,
    value: c.revenue
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-violet-600" />
            {t('analytics')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Deep retail intelligence, customer retention cohorts, dead stock alerts, and automated operational recommendations
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* SECTION 1: SMART SME INSIGHTS (Rule-based AI Architecture) */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-900/10 via-teal-900/5 to-emerald-900/10 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 shadow-xs">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t('businessInsights')}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('aiSubtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
          {analytics?.insights && analytics.insights.map((ins: any, idx: number) => {
            const isWarning = ins.type === 'warning';
            const isRec = ins.type === 'recommendation';
            const isPositive = ins.type === 'positive';

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border backdrop-blur-sm transition-all hover:scale-[1.01] ${
                  isWarning
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
                    : isPositive
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isWarning ? 'bg-amber-200/70 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200' :
                    isPositive ? 'bg-emerald-200/70 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200' :
                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {ins.type}
                  </span>
                  {ins.metric && (
                    <span className="text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {ins.metric}
                    </span>
                  )}
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2.5">
                  {ins.title}
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {ins.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Order Value (AOV)</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {formatMoney(analytics?.average_order_value || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Average ticket size per checkout</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Returning Customers</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {analytics?.returning_customers_count || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Loyalty retention cohort (&gt;1 purchase)</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">New Client Acquisitions</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {analytics?.new_customers_count || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">First-time buyers logged</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Dead / Dormant Stock</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {analytics?.dead_stock_products?.length || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Products in stock with zero sales</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
            Revenue Velocity & Trend
          </h2>
          <p className="text-[11px] text-slate-400 mb-4">
            Daily transactional performance in USD
          </p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.sales_trend || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} tickFormatter={(val) => `$${val}`} />
                <Tooltip formatter={(value: any) => formatMoney(Number(value))} />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" name="Sales Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              Sales by Category
            </h2>
            <p className="text-[11px] text-slate-400">
              Departmental sales contribution
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatMoney(Number(value))} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Selling vs Dead Stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best-Sellers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            Top Selling Products
          </h2>
          <p className="text-[11px] text-slate-400 mb-4">
            Highest revenue driving items in catalog
          </p>
          <div className="space-y-3">
            {analytics?.top_products && analytics.top_products.slice(0, 5).map((p: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">{p.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">SKU: {p.sku} • {p.units_sold} units sold</div>
                </div>
                <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                  {formatMoney(p.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slow-Moving / Dead Stock */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Slow-Moving & Dead Stock Alert
          </h2>
          <p className="text-[11px] text-slate-400 mb-4">
            Items taking up warehouse capacity with zero recent velocity
          </p>
          <div className="space-y-3">
            {analytics?.dead_stock_products && analytics.dead_stock_products.length > 0 ? (
              analytics.dead_stock_products.map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">{p.name}</div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">SKU: {p.sku} • In-stock with 0 sales</div>
                  </div>
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40">
                    Discount / Clearance
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No dormant stock detected. All active inventory is moving.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
