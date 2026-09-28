import React, { useState, useEffect } from 'react';
import {
  FileCheck, Plus, Search, Filter, RefreshCw, Eye,
  Printer, CheckCircle2, XCircle, Send, Calendar, Clock
} from 'lucide-react';
import { quotationApi, partnerApi, productApi } from '../../api/services';
import { Customer, Product } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';

interface QuotationItemRow {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  discount: number;
}

export const QuotationsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { formatMoney } = useCurrency();

  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedQuo, setSelectedQuo] = useState<any | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<QuotationItemRow[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [quoList, custList, prodList] = await Promise.all([
        quotationApi.listQuotations().catch(() => []),
        partnerApi.listCustomers().catch(() => []),
        productApi.listProducts({ size: 100 }).then(r => r.items || []).catch(() => [])
      ]);
      setQuotations(quoList || []);
      setCustomers(custList || []);
      setProducts(prodList || []);
    } catch (err) {
      console.error('Failed to load quotations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    // Check if already in list
    const existingIndex = items.findIndex(i => i.product_id === prod.id);
    if (existingIndex >= 0) {
      setItems(prev => prev.map((item, idx) => idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setItems(prev => [
        ...prev,
        {
          product_id: prod.id,
          name: prod.name_en,
          quantity: 1,
          unit_price: prod.selling_price,
          discount: 0
        }
      ]);
    }
    setSelectedProductId('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof QuotationItemRow, val: any) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, it) => sum + (it.quantity * it.unit_price) - it.discount, 0);

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one product item');
      return;
    }

    setSubmitting(true);
    try {
      await quotationApi.createQuotation({
        customer_id: customerId || undefined,
        items: items.map(it => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
          discount: it.discount
        })),
        tax: 0,
        discount: 0,
        valid_until: validUntil || undefined,
        notes
      });

      setIsCreateModalOpen(false);
      setItems([]);
      setCustomerId('');
      setNotes('');
      setValidUntil('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create quotation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (quoId: string, newStatus: string) => {
    try {
      await quotationApi.updateStatus(quoId, newStatus);
      loadData();
      if (selectedQuo && selectedQuo.id === quoId) {
        setSelectedQuo({ ...selectedQuo, status: newStatus });
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update status');
    }
  };

  const filtered = quotations.filter(q => {
    const matchesSearch = q.quotation_number?.toLowerCase().includes(search.toLowerCase()) ||
      q.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || q.status?.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePrint = (quo: any) => {
    const printWindow = window.open('', '_blank', 'width=750,height=900');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Quotation - ${quo.quotation_number}</title>
          <style>
            body { font-family: sans-serif; padding: 30px; font-size: 14px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; background: #e0e7ff; color: #3730a3; font-weight: bold; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin: 25px 0; }
            th { background: #f8fafc; text-align: left; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; font-size: 12px; text-transform: uppercase; }
            td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
            .totals { margin-left: auto; width: 300px; }
            .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
            .total-final { font-size: 18px; font-weight: bold; color: #0f172a; border-top: 2px solid #0f172a; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin: 0 0 6px 0; color: #4338ca;">PRICE QUOTATION</h1>
              <p style="margin: 0; color: #64748b;">Quotation #: <strong>${quo.quotation_number}</strong></p>
              <p style="margin: 4px 0 0 0; color: #64748b;">Date: ${new Date(quo.created_at).toLocaleDateString()}</p>
              ${quo.valid_until ? `<p style="margin: 4px 0 0 0; color: #dc2626;">Valid Until: ${new Date(quo.valid_until).toLocaleDateString()}</p>` : ''}
            </div>
            <div style="text-align: right;">
              <span class="badge">${quo.status}</span>
              <p style="margin: 10px 0 0 0; font-weight: 600;">Customer:</p>
              <p style="margin: 2px 0 0 0; color: #334155;">${quo.customer_name || 'Valued Customer'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item / Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${quo.items?.map((it: any) => `
                <tr>
                  <td>${it.product?.name_en || 'Item'}</td>
                  <td style="text-align: center;">${it.quantity}</td>
                  <td style="text-align: right;">$${(it.unit_price || 0).toFixed(2)}</td>
                  <td style="text-align: right; font-weight: 600;">$${(it.subtotal || 0).toFixed(2)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>$${(quo.subtotal || quo.total || 0).toFixed(2)}</span>
            </div>
            <div class="totals-row total-final">
              <span>Grand Total:</span>
              <span>$${(quo.total || 0).toFixed(2)}</span>
            </div>
          </div>

          ${quo.notes ? `<div style="margin-top: 30px; padding: 15px; background: #f8fafc; border-radius: 8px;"><strong>Terms & Notes:</strong><p style="margin: 5px 0 0 0; font-size: 13px; color: #475569;">${quo.notes}</p></div>` : ''}

          <script>window.onload = function() { window.print(); }</script>
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
            <FileCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            {t('nav.quotations')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'kh' ? 'បង្កើត និងគ្រប់គ្រងការផ្តល់តម្លៃជូនអតិថិជន' : 'Generate price quotes, track expiry, and convert to invoices'}
          </p>
        </div>
        <button
          onClick={() => {
            setItems([]);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {language === 'kh' ? 'បង្កើតការផ្តល់តម្លៃថ្មី' : 'New Quotation'}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'kh' ? 'ស្វែងរកលេខសម្រង់តម្លៃ ឬអតិថិជន...' : 'Search quote # or customer...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'].map((st) => (
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
          <button
            onClick={loadData}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 rounded-lg ml-1"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quotations List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
            <p>{t('common.loading')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium text-slate-600 dark:text-slate-300">
              {language === 'kh' ? 'មិនមានការផ្តល់តម្លៃទេ' : 'No quotations found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">{language === 'kh' ? 'លេខផ្តល់តម្លៃ' : 'Quote #'}</th>
                  <th className="py-3.5 px-4">{language === 'kh' ? 'អតិថិជន' : 'Customer'}</th>
                  <th className="py-3.5 px-4">{language === 'kh' ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                  <th className="py-3.5 px-4">{language === 'kh' ? 'សុពលភាពដល់' : 'Valid Until'}</th>
                  <th className="py-3.5 px-4 text-right">{language === 'kh' ? 'តម្លៃសរុប' : 'Total'}</th>
                  <th className="py-3.5 px-4 text-center">{language === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-right">{language === 'kh' ? 'សកម្មភាព' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filtered.map((quo) => (
                  <tr key={quo.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {quo.quotation_number}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      {quo.customer_name || 'Valued Customer'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(quo.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      {quo.valid_until ? new Date(quo.valid_until).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatMoney(quo.total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={
                          quo.status === 'Accepted' ? 'success' :
                          quo.status === 'Sent' ? 'info' :
                          quo.status === 'Rejected' ? 'danger' : 'default'
                        }
                      >
                        {quo.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedQuo(quo);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(quo)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Print Quotation"
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

      {/* Detail Modal */}
      {selectedQuo && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Quotation: ${selectedQuo.quotation_number}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs">
              <div>
                <span className="text-slate-400">Customer:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedQuo.customer_name || 'Walk-in'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Current Status:</span>
                <p className="font-bold uppercase text-emerald-600">{selectedQuo.status}</p>
              </div>
              <div>
                <span className="text-slate-400">Created:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(selectedQuo.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Valid Until:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedQuo.valid_until ? new Date(selectedQuo.valid_until).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {selectedQuo.notes && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold">Notes:</span> {selectedQuo.notes}
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Quotation Items</h4>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="py-2 px-3 text-left">Item</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedQuo.items?.map((it: any) => (
                      <tr key={it.id}>
                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{it.product?.name_en || 'Product'}</td>
                        <td className="py-2 px-3 text-center">{it.quantity}</td>
                        <td className="py-2 px-3 text-right">{formatMoney(it.unit_price)}</td>
                        <td className="py-2 px-3 text-right font-semibold">{formatMoney(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Total Amount:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatMoney(selectedQuo.total)}</span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-500">Change Status:</span>
              <div className="flex gap-2">
                {['Draft', 'Sent', 'Accepted', 'Rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(selectedQuo.id, status)}
                    disabled={selectedQuo.status === status}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      selectedQuo.status === status
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300'
                    }`}
                  >
                    Mark {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => handlePrint(selectedQuo)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Quotation
              </button>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={language === 'kh' ? 'បង្កើតការផ្តល់តម្លៃថ្មី' : 'Create New Quotation'}
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'kh' ? 'អតិថិជន' : 'Customer'}
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none dark:text-white"
              >
                <option value="">-- Walk-in / Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone || 'No phone'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'kh' ? 'សុពលភាពដល់' : 'Valid Until Date'}
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'kh' ? 'បន្ថែមមុខទំនិញ' : 'Add Products'}
            </label>
            <div className="flex gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none dark:text-white"
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name_en} - ${p.selling_price.toFixed(2)}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-slate-400">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-14 px-1.5 py-0.5 border rounded text-center dark:bg-slate-900"
                      />
                      <span className="text-slate-400">Price:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-16 px-1.5 py-0.5 border rounded text-right dark:bg-slate-900"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatMoney((item.quantity * item.unit_price) - item.discount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-500 hover:text-rose-700 font-bold"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'kh' ? 'កំណត់ចំណាំ / លក្ខខណ្ឌ' : 'Notes / Terms & Conditions'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Valid for 14 days. 50% deposit required upon confirmation."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none dark:text-white"
            />
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex justify-between items-center text-sm font-bold">
            <span className="text-emerald-950 dark:text-emerald-200">Grand Total:</span>
            <span className="text-emerald-600 dark:text-emerald-400">{formatMoney(subtotal)}</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {submitting ? t('common.loading') : (language === 'kh' ? 'រក្សាទុកការផ្តល់តម្លៃ' : 'Save Quotation')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
