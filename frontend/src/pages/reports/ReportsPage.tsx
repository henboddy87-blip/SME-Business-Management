import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Printer, Filter, ShoppingBag, Package, Truck, DollarSign, Calendar } from 'lucide-react';
import { dashboardApi } from '../../api/services';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';

export const ReportsPage: React.FC = () => {
  const { formatMoney } = useCurrency();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'purchases' | 'financial'>('sales');
  const [salesGroupBy, setSalesGroupBy] = useState<'product' | 'payment_method' | 'date'>('product');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        const res = await dashboardApi.getReports.sales(salesGroupBy);
        setReportData(res);
      } else if (activeTab === 'inventory') {
        const res = await dashboardApi.getReports.inventory();
        setReportData(res);
      } else if (activeTab === 'purchases') {
        const res = await dashboardApi.getReports.purchases();
        setReportData(res);
      } else {
        // Financial
        const res = await dashboardApi.getDashboard('month');
        setReportData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeTab, salesGroupBy]);

  const handleExportCsv = () => {
    if (!reportData) return;
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'sales' && salesGroupBy === 'product') {
      csvContent += 'Product Name,SKU,Quantity Sold,Revenue (USD)\n';
      reportData.forEach((row: any) => {
        csvContent += `"${row.name}","${row.sku}",${row.quantity},${row.revenue}\n`;
      });
    } else if (activeTab === 'inventory') {
      csvContent += 'Product,SKU,Unit Cost,Unit Price,Current Stock,Valuation (USD)\n';
      (reportData.items || []).forEach((row: any) => {
        csvContent += `"${row.name}","${row.sku}",${row.cost_price},${row.selling_price},${row.stock},${row.valuation}\n`;
      });
    } else {
      csvContent += JSON.stringify(reportData);
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {t('reports')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise analytics reports, inventory audits, sales distribution, and export data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-emerald-600/30 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 no-print overflow-x-auto">
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'sales'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Sales Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'inventory'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Inventory Valuation</span>
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'purchases'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Procurement Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('financial')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'financial'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Financial Snapshot</span>
        </button>
      </div>

      {/* Sub-filters for Sales Tab */}
      {activeTab === 'sales' && (
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs no-print">
          <span className="text-xs text-slate-500 font-medium">Group sales by:</span>
          <button
            onClick={() => setSalesGroupBy('product')}
            className={`px-3 py-1 rounded-lg text-xs font-medium ${salesGroupBy === 'product' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
          >
            By Product
          </button>
          <button
            onClick={() => setSalesGroupBy('payment_method')}
            className={`px-3 py-1 rounded-lg text-xs font-medium ${salesGroupBy === 'payment_method' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
          >
            By Payment Method
          </button>
          <button
            onClick={() => setSalesGroupBy('date')}
            className={`px-3 py-1 rounded-lg text-xs font-medium ${salesGroupBy === 'date' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
          >
            Daily Totals
          </button>
        </div>
      )}

      {/* Report Content Display */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            Compiling report dataset...
          </div>
        ) : activeTab === 'sales' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 font-semibold">
                  {salesGroupBy === 'product' && (
                    <>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4 text-right">Units Sold</th>
                      <th className="py-3 px-4 text-right">Total Revenue</th>
                    </>
                  )}
                  {salesGroupBy === 'payment_method' && (
                    <>
                      <th className="py-3 px-4">Payment Channel</th>
                      <th className="py-3 px-4 text-right">Transactions Count</th>
                      <th className="py-3 px-4 text-right">Total Volume</th>
                    </>
                  )}
                  {salesGroupBy === 'date' && (
                    <>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Completed Invoices</th>
                      <th className="py-3 px-4 text-right">Total Revenue</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Array.isArray(reportData) && reportData.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    {salesGroupBy === 'product' && (
                      <>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{row.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{row.sku}</td>
                        <td className="py-3 px-4 text-right font-medium">{row.quantity}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(row.revenue)}</td>
                      </>
                    )}
                    {salesGroupBy === 'payment_method' && (
                      <>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{row.payment_method}</td>
                        <td className="py-3 px-4 text-right font-medium">{row.transactions}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatMoney(row.total_usd)}</td>
                      </>
                    )}
                    {salesGroupBy === 'date' && (
                      <>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">{row.date}</td>
                        <td className="py-3 px-4 text-right font-medium">{row.orders} orders</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatMoney(row.revenue)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'inventory' ? (
          <div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Total Stock Items: {reportData?.total_items || 0}</span>
              <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                Total Valuation: {formatMoney(reportData?.total_valuation_usd || 0)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-right">In-Stock Quantity</th>
                    <th className="py-3 px-4 text-right">Asset Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reportData?.items && reportData.items.map((it: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{it.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{it.sku}</td>
                      <td className="py-3 px-4 text-right">{formatMoney(it.cost_price)}</td>
                      <td className="py-3 px-4 text-right">{formatMoney(it.selling_price)}</td>
                      <td className="py-3 px-4 text-right font-medium">{it.stock}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatMoney(it.valuation)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'purchases' ? (
          <div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Supplier Procurement History</span>
              <span className="font-bold text-sm text-amber-600">
                Total Outlay: {formatMoney(reportData?.total_purchases_usd || 0)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Supplier Name</th>
                    <th className="py-3 px-4 text-right">Total Purchases Count</th>
                    <th className="py-3 px-4 text-right">Total Amount Disbursed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reportData?.by_supplier && reportData.by_supplier.map((sup: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{sup.supplier_name}</td>
                      <td className="py-3 px-4 text-right font-medium">{sup.orders_count} orders</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600">{formatMoney(sup.total_spent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Financial Snapshot Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 text-[11px]">Total Realized Revenue</span>
                <p className="text-lg font-bold text-emerald-600">{formatMoney(reportData?.kpis?.total_sales_usd || 0)}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 text-[11px]">Gross Margin Realized</span>
                <p className="text-lg font-bold text-emerald-600">{formatMoney(reportData?.kpis?.gross_profit_usd || 0)}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 text-[11px]">Total Overhead Expenses</span>
                <p className="text-lg font-bold text-rose-500">{formatMoney(reportData?.kpis?.total_expenses_usd || 0)}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 text-[11px]">Net Commercial Retention</span>
                <p className="text-lg font-bold text-violet-600">{formatMoney(reportData?.kpis?.net_profit_usd || 0)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
