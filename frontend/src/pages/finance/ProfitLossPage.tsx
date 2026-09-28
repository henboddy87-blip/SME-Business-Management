import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, PieChart, Printer, RefreshCw, Layers, ShieldCheck, ArrowRight } from 'lucide-react';
import { financeApi } from '../../api/services';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export const ProfitLossPage: React.FC = () => {
  const { formatMoney, exchangeRate } = useCurrency();
  const { t } = useLanguage();

  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await financeApi.getProfitAndLoss();
      setSummary(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const chartData = summary ? [
    {
      name: 'Financial Performance',
      Revenue: summary.revenue_usd || 0,
      COGS: summary.cost_of_goods_sold_usd || 0,
      GrossProfit: summary.gross_profit_usd || 0,
      Expenses: summary.operating_expenses_usd || 0,
      NetProfit: summary.net_profit_usd || 0
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {t('profitLoss')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standard GAAP statement of profit and loss, gross margins, and operating profitability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print P&L Statement</span>
          </button>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {formatMoney(summary?.revenue_usd || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Realized net sales volume</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Cost of Goods Sold (COGS)</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {formatMoney(summary?.cost_of_goods_sold_usd || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Direct cost of inventory sold</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Gross Margin</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatMoney(summary?.gross_profit_usd || 0)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            {summary?.gross_margin_percent || 0}% Gross Profit Margin
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Net Operating Profit</span>
            <div className={`p-2 rounded-xl ${(summary?.net_profit_usd || 0) >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold mt-2 ${(summary?.net_profit_usd || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatMoney(summary?.net_profit_usd || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {summary?.net_margin_percent || 0}% Net Profit Margin
          </div>
        </div>
      </div>

      {/* Visual Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs no-print">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
          Income vs Cost Breakdown
        </h2>
        <p className="text-[11px] text-slate-400 mb-4">
          Comparative analysis of Revenue, Inventory Costs, Operating Overhead, and Net Retention
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="name" stroke="#888888" fontSize={12} />
              <YAxis stroke="#888888" fontSize={12} tickFormatter={(val) => `$${val}`} />
              <Tooltip formatter={(value: any) => formatMoney(Number(value))} />
              <Legend />
              <Bar dataKey="Revenue" fill="#6366f1" radius={[6, 6, 0, 0]} name="Gross Revenue" />
              <Bar dataKey="COGS" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Cost of Goods Sold" />
              <Bar dataKey="GrossProfit" fill="#10b981" radius={[6, 6, 0, 0]} name="Gross Profit" />
              <Bar dataKey="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Operating Expenses" />
              <Bar dataKey="NetProfit" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Net Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Formal P&L Statement */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs max-w-3xl mx-auto">
        <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Statement of Profit and Loss
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Prepared in accordance with SME reporting practices
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs py-2">
          {/* Revenue */}
          <div className="py-2.5 flex justify-between font-semibold text-slate-900 dark:text-slate-100">
            <span>Commercial Operating Revenue</span>
            <span>{formatMoney(summary?.revenue_usd || 0)}</span>
          </div>

          {/* Cost of Goods Sold */}
          <div className="py-2.5 flex justify-between text-slate-600 dark:text-slate-400 pl-4">
            <span>Less: Cost of Goods Sold (Inventory Outlay)</span>
            <span className="text-rose-600">({formatMoney(summary?.cost_of_goods_sold_usd || 0)})</span>
          </div>

          {/* Gross Profit */}
          <div className="py-3 flex justify-between font-bold text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/40 px-3 rounded-xl my-1">
            <span>GROSS PROFIT (Margin: {summary?.gross_margin_percent || 0}%)</span>
            <span className="text-emerald-600 dark:text-emerald-400">{formatMoney(summary?.gross_profit_usd || 0)}</span>
          </div>

          {/* Operating Expenses */}
          <div className="py-2 font-semibold text-slate-800 dark:text-slate-200 pt-3">
            Operating Expenditures (Overhead):
          </div>

          {summary?.expense_breakdown && Object.entries(summary.expense_breakdown).length > 0 ? (
            Object.entries(summary.expense_breakdown).map(([cat, val]: any) => (
              <div key={cat} className="py-1.5 flex justify-between text-slate-600 dark:text-slate-400 pl-4">
                <span>{cat}</span>
                <span>{formatMoney(val)}</span>
              </div>
            ))
          ) : (
            <div className="py-1.5 text-slate-400 pl-4">No itemized overhead recorded</div>
          )}

          <div className="py-2 flex justify-between font-medium text-slate-700 dark:text-slate-300 pl-2">
            <span>Total Operating Expenses</span>
            <span className="text-rose-600">({formatMoney(summary?.operating_expenses_usd || 0)})</span>
          </div>

          {/* Net Profit */}
          <div className="py-4 flex justify-between font-bold text-base text-slate-900 dark:text-slate-100 bg-emerald-50/70 dark:bg-emerald-950/40 px-4 rounded-xl mt-3 border border-emerald-200 dark:border-emerald-800">
            <span>NET PROFIT (Margin: {summary?.net_margin_percent || 0}%)</span>
            <span className={(summary?.net_profit_usd || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
              {formatMoney(summary?.net_profit_usd || 0)}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-400">
          Conversion baseline rate: 1 USD = 4,100 KHR • Net in Riel: ៛{Math.round((summary?.net_profit_usd || 0) * 4100).toLocaleString()} KHR
        </div>
      </div>
    </div>
  );
};
