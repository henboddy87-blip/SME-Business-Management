import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Search, Filter, Calendar, Eye, RefreshCw,
  Printer, ArrowUpRight, CheckCircle2, Clock, AlertCircle, FileText
} from 'lucide-react';
import { saleApi } from '../../api/services';
import { Sale } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';

export const SalesHistoryPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { formatMoney } = useCurrency();

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = await saleApi.listSales({ search });
      setSales(data || []);
    } catch (err) {
      console.error('Failed to load sales history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [search]);

  const filteredSales = sales.filter(s => {
    if (statusFilter !== 'ALL' && s.payment_status?.toUpperCase() !== statusFilter) {
      return false;
    }
    return true;
  });

  const totalRevenue = sales.reduce((acc, s) => acc + (s.total_amount_usd ?? s.total_amount ?? 0), 0);
  const totalSalesCount = sales.length;
  const avgOrderValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
  const totalPaid = sales.reduce((acc, s) => acc + (s.paid_amount_usd ?? s.paid_amount ?? 0), 0);

  const handlePrint = (sale: Sale) => {
    const printWindow = window.open('', '_blank', 'width=450,height=650');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${sale.invoice_number}</title>
          <style>
            body { font-family: monospace; padding: 20px; font-size: 13px; color: #111; }
            .text-center { text-align: center; }
            .header { margin-bottom: 15px; border-bottom: 1px dashed #333; padding-bottom: 10px; }
            .line-item { display: flex; justify-content: space-between; margin: 4px 0; }
            .total-section { border-top: 1px dashed #333; margin-top: 10px; padding-top: 10px; }
            .footer { margin-top: 20px; text-align: center; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="text-center header">
            <h2 style="margin:0;">OFFICIAL RECEIPT</h2>
            <p style="margin:4px 0;">Invoice #: ${sale.invoice_number}</p>
            <p style="margin:0;">Date: ${new Date(sale.created_at).toLocaleString()}</p>
          </div>
          <div>
            ${sale.items?.map(it => `
              <div class="line-item">
                <span>${it.product?.name_en || 'Item'} x${it.quantity}</span>
                <span>$${(it.subtotal || 0).toFixed(2)}</span>
              </div>
            `).join('') || ''}
          </div>
          <div class="total-section">
            <div class="line-item"><strong>Total:</strong> <strong>$${(sale.total_amount_usd ?? sale.total_amount ?? 0).toFixed(2)}</strong></div>
            <div class="line-item"><span>Paid:</span> <span>$${(sale.paid_amount_usd ?? sale.paid_amount ?? 0).toFixed(2)}</span></div>
            <div class="line-item"><span>Status:</span> <span>${sale.payment_status}</span></div>
          </div>
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>អរគុណសម្រាប់ការគាំទ្រ</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            {t('nav.salesHistory')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'kh' ? 'តាមដាន និងគ្រប់គ្រងប្រតិបត្តិការលក់ទាំងអស់' : 'Track and review all completed sales transactions & receipts'}
          </p>
        </div>
        <button
          onClick={fetchSales}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition"
        >
          <RefreshCw className="w-4 h-4" />
          {t('common.refresh')}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {language === 'kh' ? 'ចំណូលលក់សរុប' : 'Total Revenue'}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {formatMoney(totalRevenue)}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> {language === 'kh' ? 'បានទូទាត់' : 'Collected'}: {formatMoney(totalPaid)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {language === 'kh' ? 'ការលក់សរុប' : 'Total Orders'}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {totalSalesCount} {language === 'kh' ? 'វិក្កយបត្រ' : 'Sales'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'kh' ? 'ប្រតិបត្តិការបានកត់ត្រា' : 'Recorded transactions'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {language === 'kh' ? 'តម្លៃមធ្យមក្នុងមួយការបញ្ជា' : 'Avg Order Value'}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {formatMoney(avgOrderValue)}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            {language === 'kh' ? 'ក្នុងមួយការទិញ' : 'Per transaction'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {language === 'kh' ? 'អត្រាទូទាត់ជោគជ័យ' : 'Payment Success'}
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {totalSalesCount > 0 ? Math.round((sales.filter(s => s.payment_status === 'paid').length / totalSalesCount) * 100) : 100}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {sales.filter(s => s.payment_status === 'paid').length} {language === 'kh' ? 'បានបង់ពេញ' : 'Fully Paid'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'kh' ? 'ស្វែងរកតាមលេខវិក្កយបត្រ...' : 'Search by invoice #...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {language === 'kh' ? 'ស្ថានភាពទូទាត់:' : 'Status:'}
          </span>
          {['ALL', 'PAID', 'PARTIAL', 'UNPAID'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                statusFilter === status
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Sales List Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
            <p>{t('common.loading')}</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium text-slate-600 dark:text-slate-300">
              {language === 'kh' ? 'មិនមានទិន្នន័យលក់ទេ' : 'No sales found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">{language === 'kh' ? 'លេខវិក្កយបត្រ' : 'Invoice #'}</th>
                  <th className="py-3.5 px-4">{language === 'kh' ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                  <th className="py-3.5 px-4">{language === 'kh' ? 'អតិថិជន' : 'Customer'}</th>
                  <th className="py-3.5 px-4">{language === 'kh' ? 'វិធីសាស្ត្រ' : 'Payment'}</th>
                  <th className="py-3.5 px-4 text-right">{language === 'kh' ? 'ចំនួនសរុប' : 'Total'}</th>
                  <th className="py-3.5 px-4 text-center">{language === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-right">{language === 'kh' ? 'សកម្មភាព' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {sale.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                      {new Date(sale.created_at).toLocaleDateString()} {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      {sale.customer ? (sale.customer.name || sale.customer.phone) : (language === 'kh' ? 'អតិថិជនទូទៅ' : 'Walk-in Customer')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                        {sale.payment_method || 'CASH'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatMoney(sale.total_amount_usd ?? sale.total_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={
                          sale.payment_status === 'paid' ? 'success' :
                          sale.payment_status === 'partial' ? 'warning' : 'danger'
                        }
                      >
                        {sale.payment_status?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(sale)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Sale Details: ${selectedSale.invoice_number}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs">
              <div>
                <span className="text-slate-400">Date:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(selectedSale.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Payment Status:</span>
                <p className="font-bold uppercase text-emerald-600">
                  {selectedSale.payment_status}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Customer:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedSale.customer?.name || 'Walk-in'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Payment Method:</span>
                <p className="font-semibold uppercase text-slate-800 dark:text-slate-200">
                  {selectedSale.payment_method || 'CASH'}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Items Sold</h4>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="py-2 px-3 text-left">Item</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedSale.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {item.product?.name_en || 'Product'}
                        </td>
                        <td className="py-2 px-3 text-center">{item.quantity}</td>
                        <td className="py-2 px-3 text-right">{formatMoney(item.unit_price)}</td>
                        <td className="py-2 px-3 text-right font-semibold">{formatMoney(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>{formatMoney(selectedSale.subtotal || (selectedSale.total_amount_usd ?? selectedSale.total_amount))}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Discount:</span>
                <span>-{formatMoney(selectedSale.discount_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax:</span>
                <span>+{formatMoney(selectedSale.tax_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Total Amount:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatMoney(selectedSale.total_amount_usd ?? selectedSale.total_amount)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => handlePrint(selectedSale)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
