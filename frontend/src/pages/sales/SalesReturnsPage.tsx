import React, { useState, useEffect } from 'react';
import {
  RotateCcw, Plus, Search, RefreshCw, AlertCircle,
  CheckCircle, FileText, ArrowRight, DollarSign
} from 'lucide-react';
import { saleApi } from '../../api/services';
import { Sale } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';

interface ReturnItemState {
  product_id: string;
  variant_id?: string;
  name: string;
  max_qty: number;
  quantity: number;
  unit_price: number;
  selected: boolean;
}

export const SalesReturnsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { formatMoney } = useCurrency();

  const [returns, setReturns] = useState<any[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [returnItems, setReturnItems] = useState<ReturnItemState[]>([]);
  const [reason, setReason] = useState('Damaged / Defective');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [rets, sList] = await Promise.all([
        saleApi.listReturns().catch(() => []),
        saleApi.listSales().catch(() => [])
      ]);
      setReturns(rets || []);
      setSales(sList || []);
    } catch (err) {
      console.error('Failed to load returns data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaleSelect = (saleId: string) => {
    setSelectedSaleId(saleId);
    const sale = sales.find(s => s.id === saleId);
    if (sale && sale.items) {
      setReturnItems(
        sale.items.map(it => ({
          product_id: it.product_id,
          variant_id: it.variant_id,
          name: it.product?.name_en || 'Product',
          max_qty: it.quantity,
          quantity: 1,
          unit_price: it.unit_price,
          selected: false
        }))
      );
    } else {
      setReturnItems([]);
    }
  };

  const handleToggleItem = (index: number) => {
    setReturnItems(prev => prev.map((item, i) => i === index ? { ...item, selected: !item.selected } : item));
  };

  const handleQtyChange = (index: number, qty: number) => {
    setReturnItems(prev => prev.map((item, i) => {
      if (i === index) {
        const validQty = Math.max(1, Math.min(item.max_qty, qty));
        return { ...item, quantity: validQty };
      }
      return item;
    }));
  };

  const totalRefundAmount = returnItems
    .filter(it => it.selected)
    .reduce((sum, it) => sum + (it.quantity * it.unit_price), 0);

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const selectedItems = returnItems.filter(it => it.selected);
    if (selectedItems.length === 0) {
      setErrorMsg(language === 'kh' ? 'សូមជ្រើសរើសមុខទំនិញយ៉ាងហោចមួយដើម្បីប្តូរ/សង' : 'Please select at least one item to return');
      return;
    }

    setSubmitting(true);
    try {
      const finalReason = reason === 'Other' ? customReason : reason;
      await saleApi.createReturn({
        sale_id: selectedSaleId,
        reason: finalReason,
        items: selectedItems.map(it => ({
          product_id: it.product_id,
          variant_id: it.variant_id,
          quantity: it.quantity,
          unit_price: it.unit_price
        }))
      });

      setSuccessMsg(language === 'kh' ? 'ការប្តូរទំនិញត្រូវបានកត់ត្រា និងបញ្ចូលស្តុកឡើងវិញដោយជោគជ័យ' : 'Return processed and stock replenished successfully!');
      setIsModalOpen(false);
      setSelectedSaleId('');
      setReturnItems([]);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to process return');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReturns = returns.filter(r =>
    r.return_number?.toLowerCase().includes(search.toLowerCase()) ||
    r.reason?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-7 h-7 text-rose-600 dark:text-rose-400" />
            {t('nav.salesReturns')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'kh' ? 'គ្រប់គ្រងការប្តូរទំនិញ ការសងប្រាក់ និងការបញ្ចូលស្តុកស្វ័យប្រវត្តិ' : 'Manage customer returns, issue refunds, and restore warehouse stock automatically'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setErrorMsg('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            {language === 'kh' ? 'កត់ត្រាការប្តូរទំនិញ' : 'Process Return'}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 flex items-center gap-2 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'kh' ? 'ស្វែងរកលេខកូដប្តូរទំនិញ...' : 'Search return number or reason...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none dark:text-white"
          />
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('common.refresh')}
        </button>
      </div>

      {/* Returns List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-rose-500" />
            <p>{t('common.loading')}</p>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium text-slate-600 dark:text-slate-300">
              {language === 'kh' ? 'មិនទាន់មានការប្តូរទំនិញនៅឡើយទេ' : 'No sales returns recorded yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">{language === 'kh' ? 'លេខកូដប្តូរទំនិញ' : 'Return #'}</th>
                  <th className="py-3.5 px-4">{language === 'kh' ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                  <th className="py-3.5 px-4">{language === 'kh' ? 'មូលហេតុ' : 'Reason'}</th>
                  <th className="py-3.5 px-4 text-right">{language === 'kh' ? 'ប្រាក់សងសរុប' : 'Refund Amount'}</th>
                  <th className="py-3.5 px-4 text-center">{language === 'kh' ? 'ស្ថានភាពស្តុក' : 'Restock Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-rose-600 dark:text-rose-400">
                      {ret.return_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                      {new Date(ret.created_at).toLocaleDateString()} {new Date(ret.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200">
                      {ret.reason || 'Customer request'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                      {formatMoney(ret.total_refund_usd)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="success">Restocked</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Process Return Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={language === 'kh' ? 'ដំណើរការការប្តូរទំនិញ និងសងប្រាក់' : 'Process Sales Return & Restock'}
      >
        <form onSubmit={handleSubmitReturn} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'kh' ? 'ជ្រើសរើសវិក្កយបត្រដើម *' : 'Select Original Sale Invoice *'}
            </label>
            <select
              required
              value={selectedSaleId}
              onChange={(e) => handleSaleSelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
            >
              <option value="">-- {language === 'kh' ? 'ជ្រើសរើសវិក្កយបត្រ' : 'Select Invoice'} --</option>
              {sales.map((sale) => (
                <option key={sale.id} value={sale.id}>
                  {sale.invoice_number} - {sale.customer?.name || 'Walk-in'} ({formatMoney(sale.total_amount_usd ?? sale.total_amount)}) - {new Date(sale.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {selectedSaleId && returnItems.length > 0 && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === 'kh' ? 'ជ្រើសរើសមុខទំនិញ និងចំនួនត្រូវប្តូរ *' : 'Select Items to Return *'}
              </label>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {returnItems.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleItem(idx)}
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</p>
                        <p className="text-slate-400">Sold: {item.max_qty} @ {formatMoney(item.unit_price)}</p>
                      </div>
                    </div>
                    {item.selected && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          max={item.max_qty}
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold"
                        />
                        <span className="font-bold text-rose-600 dark:text-rose-400 min-w-16 text-right">
                          {formatMoney(item.quantity * item.unit_price)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'kh' ? 'មូលហេតុនៃការប្តូរ' : 'Return Reason'}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
            >
              <option value="Damaged / Defective">Damaged / Defective</option>
              <option value="Customer Changed Mind">Customer Changed Mind</option>
              <option value="Wrong Item Delivered">Wrong Item Delivered</option>
              <option value="Other">Other Reason</option>
            </select>
          </div>

          {reason === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'kh' ? 'បញ្ជាក់មូលហេតុ' : 'Specify Reason'}
              </label>
              <input
                type="text"
                required
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Explain reason for return"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
              />
            </div>
          )}

          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === 'kh' ? 'ចំនួនទឹកប្រាក់សងសរុប:' : 'Total Refund Amount:'}
            </span>
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {formatMoney(totalRefundAmount)}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || totalRefundAmount <= 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50 transition"
            >
              {submitting ? t('common.loading') : (language === 'kh' ? 'បញ្ជាក់ការសងប្រាក់' : 'Confirm Return & Restock')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
