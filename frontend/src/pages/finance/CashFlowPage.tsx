import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowDownLeft, ArrowUpRight, TrendingUp, Wallet, RefreshCw, BarChart2, CheckCircle2 } from 'lucide-react';
import { financeApi } from '../../api/services';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export const CashFlowPage: React.FC = () => {
  const { formatMoney, currency } = useCurrency();
  const { t } = useLanguage();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await financeApi.getCashFlow();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const chartData = data ? [
    {
      name: 'Cash Flow Dynamics',
      Inflow: data.total_inflow_usd || 0,
      Outflow: data.total_outflow_usd || 0,
      Net: data.net_cash_flow_usd || 0
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {t('cashFlow')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time cash solvency, operational cash inflows and disbursements
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Opening Balance</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {formatMoney(data?.opening_balance_usd || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Base cash float / drawer reserve</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Cash Inflow</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            +{formatMoney(data?.total_inflow_usd || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Sales income + debt recoveries</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Cash Outflow</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            -{formatMoney(data?.total_outflow_usd || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Inventory payments + expenses</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Net Operating Flow</span>
            <div className={`p-2 rounded-xl ${(data?.net_cash_flow_usd || 0) >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold mt-2 ${(data?.net_cash_flow_usd || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {formatMoney(data?.net_cash_flow_usd || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Closing Est: {formatMoney(data?.closing_balance_usd || 0)}</div>
        </div>
      </div>

      {/* Chart & Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Chart */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              Cash Inflow vs Outflow Comparison
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Net liquidity generated by commercial business activities
            </p>
          </div>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} tickFormatter={(val) => `$${val}`} />
                <Tooltip formatter={(value: any) => formatMoney(Number(value))} />
                <Legend />
                <Bar dataKey="Inflow" fill="#10b981" radius={[8, 8, 0, 0]} name="Cash Inflow" />
                <Bar dataKey="Outflow" fill="#f43f5e" radius={[8, 8, 0, 0]} name="Cash Outflow" />
                <Bar dataKey="Net" fill="#6366f1" radius={[8, 8, 0, 0]} name="Net Flow" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Itemized Ledger Tables */}
        <div className="lg:col-span-6 space-y-4">
          {/* Inflows breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Inflow Streams</span>
              </div>
              <span className="text-xs font-bold text-emerald-600">
                +{formatMoney(data?.total_inflow_usd || 0)}
              </span>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              {data?.inflow_details && Object.entries(data.inflow_details).map(([key, val]: any) => (
                <div key={key} className="flex justify-between items-center py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <span className="text-slate-600 dark:text-slate-400">{key}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatMoney(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Outflows breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Outflow Deductions</span>
              </div>
              <span className="text-xs font-bold text-rose-600">
                -{formatMoney(data?.total_outflow_usd || 0)}
              </span>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              {data?.outflow_details && Object.entries(data.outflow_details).map(([key, val]: any) => (
                <div key={key} className="flex justify-between items-center py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <span className="text-slate-600 dark:text-slate-400">{key}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatMoney(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
