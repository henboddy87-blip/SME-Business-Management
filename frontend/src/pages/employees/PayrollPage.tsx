import React, { useState, useEffect } from 'react';
import { DollarSign, Printer, Download, Users, FileText, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { hrApi } from '../../api/services';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';
import { Modal } from '../../components/common/Modal';

export const PayrollPage: React.FC = () => {
  const { formatMoney, exchangeRate } = useCurrency();
  const { t } = useLanguage();

  const [payrollItems, setPayrollItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await hrApi.getPayrollPreview();
      setPayrollItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalBase = payrollItems.reduce((acc, p) => acc + (p.base_salary || 0), 0);
  const totalAllowances = payrollItems.reduce((acc, p) => acc + (p.allowance || 0), 0);
  const totalNet = payrollItems.reduce((acc, p) => acc + (p.net_salary || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {t('payroll')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated monthly payroll preview, Cambodian SME allowances, bonuses, and salary slips
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-emerald-600/30 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Payroll Register</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Net Payroll</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {formatMoney(totalNet)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            ≈ ៛{Math.round(totalNet * exchangeRate).toLocaleString()} KHR
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Base Salary Total</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {formatMoney(totalBase)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Contractual baseline wage</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Allowances & Benefits</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            +{formatMoney(totalAllowances)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Transportation, food & phone subsidies</div>
        </div>
      </div>

      {/* Payroll Preview Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 font-semibold">
                <th className="py-3 px-4">Employee Code</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Department / Role</th>
                <th className="py-3 px-4 text-right">Base Salary</th>
                <th className="py-3 px-4 text-right">Allowance</th>
                <th className="py-3 px-4 text-right">Bonuses</th>
                <th className="py-3 px-4 text-right">Deductions</th>
                <th className="py-3 px-4 text-right">Net Payable (USD)</th>
                <th className="py-3 px-4 text-right">Net in KHR</th>
                <th className="py-3 px-4 text-right no-print">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading payroll computations...
                  </td>
                </tr>
              ) : payrollItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No active staff found for payroll generation.
                  </td>
                </tr>
              ) : (
                payrollItems.map((p) => (
                  <tr key={p.employee_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {p.employee_code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {p.employee_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {p.department || 'Operations'} • {p.position || 'Staff'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatMoney(p.base_salary, 'USD')}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-600 font-medium">
                      +{formatMoney(p.allowance, 'USD')}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-600 font-medium">
                      +{formatMoney(p.bonus || 0, 'USD')}
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-500 font-medium">
                      -{formatMoney(p.deduction || 0, 'USD')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {formatMoney(p.net_salary, 'USD')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                      ៛{Math.round(p.net_salary * exchangeRate).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right no-print">
                      <button
                        onClick={() => setSelectedSlip(p)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                        title="View Pay Slip"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Employee Pay Slip */}
      {selectedSlip && (
        <Modal
          isOpen={!!selectedSlip}
          onClose={() => setSelectedSlip(null)}
          title={`Salary Slip: ${selectedSlip.employee_name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedSlip.employee_name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Code: {selectedSlip.employee_code}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                  Ready for Disbursal
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Salary:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">${selectedSlip.base_salary.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Living / Travel Allowance:</span>
                  <span className="font-semibold text-emerald-600">+${selectedSlip.allowance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Performance Bonus:</span>
                  <span className="font-semibold text-emerald-600">+${(selectedSlip.bonus || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Attendance Deductions:</span>
                  <span className="font-semibold text-rose-600">-${(selectedSlip.deduction || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <div className="flex justify-between text-base font-bold">
                <span>Net Pay (USD):</span>
                <span className="text-emerald-600 dark:text-emerald-400">${selectedSlip.net_salary.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-mono mt-1">
                <span>Payable in Riel (KHR):</span>
                <span>៛{Math.round(selectedSlip.net_salary * exchangeRate).toLocaleString()} KHR</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl text-xs hover:bg-emerald-700 shadow-xs shadow-emerald-600/30"
              >
                Print Slip
              </button>
              <button
                onClick={() => setSelectedSlip(null)}
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
