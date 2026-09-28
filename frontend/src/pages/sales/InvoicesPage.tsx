import React, { useState, useEffect } from 'react';
import {
  FileText, Search, Filter, RefreshCw, Eye,
  Printer, CheckCircle2, Clock, AlertCircle, Building2
} from 'lucide-react';
import { invoiceApi } from '../../api/services';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';

export const InvoicesPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { formatMoney } = useCurrency();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoiceApi.listInvoices();
      setInvoices(data || []);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleViewInvoice = async (invId: string) => {
    setLoadingDetails(true);
    setIsDetailModalOpen(true);
    try {
      const details = await invoiceApi.getDetails(invId);
      setSelectedInvoice(details);
    } catch (err) {
      console.error('Failed to fetch invoice details', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePrint = (inv: any) => {
    const printWindow = window.open('', '_blank', 'width=800,height=950');
    if (!printWindow) return;

    const org = inv.organization || {};
    const settings = inv.settings || {};
    const rate = settings.khr_exchange_rate || 4100;
    const totalKhr = Math.round((inv.total || 0) * rate);

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${inv.invoice_number}</title>
          <style>
            body { font-family: 'Inter', sans-serif, -apple-system; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 20px; }
            .biz-title { font-size: 24px; font-weight: 800; color: #1e293b; margin: 0; }
            .biz-subtitle { font-size: 13px; color: #64748b; margin: 3px 0; }
            .inv-meta { text-align: right; }
            .inv-number { font-size: 20px; font-weight: 800; color: #4338ca; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; padding: 15px; background: #f8fafc; border-radius: 8px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
            th { background: #0f172a; color: white; padding: 10px 12px; text-align: left; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
            td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
            .totals-container { margin-left: auto; width: 320px; font-size: 14px; }
            .totals-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .grand-total { border-top: 2px solid #0f172a; font-weight: 800; font-size: 18px; margin-top: 5px; padding-top: 8px; color: #0f172a; }
            .khr-total { color: #4338ca; font-size: 15px; font-weight: 700; }
            .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 15px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="biz-title">${org.name || 'CAMBODIA SME BUSINESS'}</h1>
              <p class="biz-subtitle">${org.address || 'Phnom Penh, Cambodia'}</p>
              <p class="biz-subtitle">Tel: ${org.phone || '012 345 678'} | Email: ${org.email || 'info@sme.com'}</p>
              ${settings.cambodian_tax_number ? `<p class="biz-subtitle">VATTIN / Tax ID: <strong>${settings.cambodian_tax_number}</strong></p>` : ''}
            </div>
            <div class="inv-meta">
              <div class="inv-number">${inv.invoice_number}</div>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Issue Date: ${new Date(inv.issue_date).toLocaleDateString()}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Status: <strong>${inv.status}</strong></p>
            </div>
          </div>

          <div class="details-grid">
            <div>
              <strong>Billed To:</strong>
              <p style="margin: 3px 0;"><strong>${inv.customer?.name || 'Walk-in Customer'}</strong></p>
              ${inv.customer?.phone ? `<p style="margin: 0; color: #64748b;">Tel: ${inv.customer.phone}</p>` : ''}
              ${inv.customer?.address ? `<p style="margin: 0; color: #64748b;">Address: ${inv.customer.address}</p>` : ''}
            </div>
            <div style="text-align: right;">
              <strong>Payment Terms:</strong>
              <p style="margin: 3px 0;">Due upon receipt</p>
              <p style="margin: 0; color: #64748b;">Official Cambodian SME Tax Invoice</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item & Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${inv.items?.map((it: any) => `
                <tr>
                  <td>
                    <strong>${it.product_name || 'Product'}</strong>
                    ${it.sku ? `<br/><span style="font-size: 11px; color: #64748b;">SKU: ${it.sku}</span>` : ''}
                  </td>
                  <td style="text-align: center;">${it.quantity}</td>
                  <td style="text-align: right;">$${(it.unit_price || 0).toFixed(2)}</td>
                  <td style="text-align: right; font-weight: 600;">$${(it.subtotal || 0).toFixed(2)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>

          <div class="totals-container">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>$${(inv.subtotal || inv.total || 0).toFixed(2)}</span>
            </div>
            ${inv.discount > 0 ? `
              <div class="totals-row">
                <span>Discount:</span>
                <span>-$${(inv.discount || 0).toFixed(2)}</span>
              </div>
            ` : ''}
            ${inv.tax > 0 ? `
              <div class="totals-row">
                <span>Tax / VAT (10%):</span>
                <span>+$${(inv.tax || 0).toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="totals-row grand-total">
              <span>Total USD:</span>
              <span>$${(inv.total || 0).toFixed(2)}</span>
            </div>
            <div class="totals-row khr-total">
              <span>Total KHR (៛${rate.toLocaleString()}):</span>
              <span>៛${totalKhr.toLocaleString()}</span>
            </div>
            <div class="totals-row" style="margin-top: 5px; font-size: 12px; color: #16a34a;">
              <span>Amount Paid:</span>
              <span>$${(inv.paid_amount || 0).toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <p>${settings.invoice_footer || 'Thank you for choosing our services!'}</p>
            <p>សូមអរគុណចំពោះការគាំទ្ររបស់លោកអ្នក</p>
          </div>

          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredInvoices = invoices.filter(i => {
    const matchesSearch = i.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      i.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || i.status?.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            {t('nav.invoices')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'kh' ? 'វិក្កយបត្រផ្លូវការដែលបានបង្កើតពីការលក់ និងសម្រង់តម្លៃ' : 'Official VAT-compliant invoices generated from POS and sales'}
          </p>
        </div>
        <button
          onClick={loadInvoices}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl"
        >
          <RefreshCw className="w-4 h-4" />
          {t('common.refresh')}
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'kh' ? 'ស្វែងរកលេខវិក្កយបត្រ ឬអតិថិជន...' : 'Search invoice # or customer...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['ALL', 'PAID', 'ISSUED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
            <p>{t('common.loading')}</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium text-slate-600 dark:text-slate-300">
              {language === 'kh' ? 'មិនមានវិក្កយបត្រទេ' : 'No invoices found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">{language === 'kh' ? 'លេខវិក្កយបត្រ' : 'Invoice #'}</th>
                  <th className="py-3.5 px-4">{language === 'kh' ? 'កាលបរិច្ឆេទ' : 'Issue Date'}</th>
                  <th className="py-3.5 px-4">{language === 'kh' ? 'អតិថិជន' : 'Customer'}</th>
                  <th className="py-3.5 px-4 text-right">{language === 'kh' ? 'ចំនួនសរុប' : 'Total'}</th>
                  <th className="py-3.5 px-4 text-right">{language === 'kh' ? 'បានបង់' : 'Paid'}</th>
                  <th className="py-3.5 px-4 text-center">{language === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-right">{language === 'kh' ? 'សកម្មភាព' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(inv.issue_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      {inv.customer_name || 'Walk-in Customer'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatMoney(inv.total)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {formatMoney(inv.paid_amount || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={
                          inv.status === 'Paid' ? 'success' :
                          inv.status === 'Issued' ? 'warning' : 'default'
                        }
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewInvoice(inv.id)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition"
                        title="View & Print Official Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Official Invoice: ${selectedInvoice.invoice_number}`}
        >
          {loadingDetails ? (
            <div className="p-8 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
              Loading details...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {selectedInvoice.organization?.name || 'Cambodian SME'}
                    </h3>
                    <p className="text-slate-500">{selectedInvoice.organization?.address || 'Cambodia'}</p>
                    {selectedInvoice.settings?.cambodian_tax_number && (
                      <p className="text-slate-500">Tax ID: <strong>{selectedInvoice.settings.cambodian_tax_number}</strong></p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-600">{selectedInvoice.invoice_number}</span>
                    <p className="text-slate-500">{new Date(selectedInvoice.issue_date).toLocaleDateString()}</p>
                    <Badge variant={selectedInvoice.status === 'Paid' ? 'success' : 'warning'}>
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400">Customer: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedInvoice.customer?.name || 'Walk-in Customer'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Invoice Items</h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      <tr>
                        <th className="py-2 px-3 text-left">Item</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Unit Price</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedInvoice.items?.map((it: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{it.product_name}</td>
                          <td className="py-2 px-3 text-center">{it.quantity}</td>
                          <td className="py-2 px-3 text-right">{formatMoney(it.unit_price)}</td>
                          <td className="py-2 px-3 text-right font-semibold">{formatMoney(it.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatMoney(selectedInvoice.subtotal || selectedInvoice.total)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Grand Total:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatMoney(selectedInvoice.total)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => handlePrint(selectedInvoice)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Official Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
