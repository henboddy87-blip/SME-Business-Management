import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Search, Filter, ArrowDownLeft, ArrowUpRight, FileText, CheckCircle2 } from 'lucide-react';
import { financeApi } from '../../api/services';
import { Payment } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';

export const PaymentsPage: React.FC = () => {
  const { formatMoney } = useCurrency();
  const { t } = useLanguage();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeApi.listPayments();
      setPayments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPayments = payments.filter(p => {
    const matchesSearch =
      p.payment_number.toLowerCase().includes(search.toLowerCase()) ||
      (p.customer_name && p.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.supplier_name && p.supplier_name.toLowerCase().includes(search.toLowerCase()));
    const matchesMethod = !methodFilter || p.payment_method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const totalInflows = payments
    .filter(p => p.reference_type === 'Sale')
    .reduce((sum, p) => sum + (p.amount_usd || 0), 0);

  const totalOutflows = payments
    .filter(p => p.reference_type === 'Purchase' || p.reference_type === 'Expense')
    .reduce((sum, p) => sum + (p.amount_usd || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {t('payments')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Unified payment transaction ledger for customer sales receipts, supplier payments, and KHQR transactions
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Customer Inflows</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            +{formatMoney(totalInflows)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Sales receipts & credit collections</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Outflow Disbursements</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            -{formatMoney(totalOutflows)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Purchases and operational payments</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ledger Entries</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {payments.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Reconciled payment records</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payment voucher or party name..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
          />
        </div>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 min-w-[160px]"
        >
          <option value="">All Payment Methods</option>
          <option value="Cash">Cash</option>
          <option value="Bakong KHQR">Bakong KHQR</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Card">Card</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 font-semibold">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Transaction Type</th>
                <th className="py-3 px-4">Related Party</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount (USD)</th>
                <th className="py-3 px-4 text-right">Amount (KHR)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading payments ledger...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isInflow = p.reference_type === 'Sale';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {p.payment_number}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {p.payment_date}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isInflow
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}>
                          {isInflow ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {p.reference_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {p.customer_name || p.supplier_name || 'Business Operation'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 font-bold text-right ${isInflow ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {isInflow ? '+' : '-'}{formatMoney(p.amount_usd, 'USD')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 text-right">
                        ៛{(p.amount_khr || Math.round(p.amount_usd * 4100)).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="success">Completed</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          title="View Payment Voucher"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Payment Voucher Details */}
      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title={`Payment Receipt Voucher: ${selectedPayment.payment_number}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Voucher Reference:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedPayment.payment_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction Type:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPayment.reference_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Related Entity:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPayment.customer_name || selectedPayment.supplier_name || 'General Business'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Gateway/Method:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedPayment.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Date:</span>
                <span className="text-slate-700 dark:text-slate-300">{selectedPayment.payment_date}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1">
              <div className="flex justify-between text-base font-bold">
                <span>Amount Paid (USD):</span>
                <span className="text-emerald-600 dark:text-emerald-400">${selectedPayment.amount_usd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500 font-mono">
                <span>Amount in Khmer Riel:</span>
                <span>៛{(selectedPayment.amount_khr || Math.round(selectedPayment.amount_usd * 4100)).toLocaleString()} KHR</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl text-xs hover:bg-emerald-700 cursor-pointer shadow-xs"
              >
                Print Voucher
              </button>
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs"
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
