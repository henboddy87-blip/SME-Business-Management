import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ArrowRight, ArrowLeft, Building2, Store,
  Warehouse, Package, Users, CreditCard, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { orgApi, warehouseApi, productApi, userApi } from '../../api/services';

export const OnboardingWizardPage: React.FC = () => {
  const { tenant, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // Form states across wizard steps
  const [bizInfo, setBizInfo] = useState({
    name: tenant?.name || '',
    phone: tenant?.phone || '',
    address: tenant?.address || '',
  });

  const [bizType, setBizType] = useState(tenant?.business_type || 'Retail');

  const [warehouseData, setWarehouseData] = useState({
    name: 'Main Warehouse',
    code: 'WH-MAIN',
    address: 'Phnom Penh',
  });

  const [productData, setProductData] = useState({
    name_en: 'First Product Item',
    name_kh: 'ទំនិញគំរូដំបូង',
    sku: 'PROD-001',
    cost_price: 5.0,
    selling_price: 12.0,
    initial_stock: 50.0,
  });

  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeeName, setEmployeeName] = useState('');

  const [paymentConfig, setPaymentConfig] = useState({
    enable_khqr: true,
    khr_exchange_rate: 4100.0,
    khqr_merchant_name: tenant?.name || 'Khmer Business',
  });

  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Finalize setup
      setLoading(true);
      try {
        await orgApi.completeOnboarding();
        await refreshProfile();
        navigate('/dashboard');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const stepsMeta = [
    { num: 1, title: 'Business Info', icon: Building2 },
    { num: 2, title: 'Business Type', icon: Store },
    { num: 3, title: 'First Warehouse', icon: Warehouse },
    { num: 4, title: 'First Product', icon: Package },
    { num: 5, title: 'Team Members', icon: Users },
    { num: 6, title: 'Payments & KHQR', icon: CreditCard },
    { num: 7, title: 'Launch', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10">
        {/* Progress Bar & Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Setup Progress: Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          {/* Stepper icons */}
          <div className="hidden sm:flex items-center justify-between mt-6">
            {stepsMeta.map((s) => {
              const Icon = s.icon;
              const isActive = currentStep === s.num;
              const isDone = currentStep > s.num;
              return (
                <div key={s.num} className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 mt-1.5">{s.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="py-4">
          {/* Step 1: Business info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Confirm Business Information</h2>
              <p className="text-xs text-slate-500">Provide basic contact information for invoices and receipts.</p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Store Name</label>
                <input
                  type="text"
                  value={bizInfo.name}
                  onChange={(e) => setBizInfo({ ...bizInfo, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Business Phone Number</label>
                <input
                  type="text"
                  value={bizInfo.phone}
                  onChange={(e) => setBizInfo({ ...bizInfo, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
                <input
                  type="text"
                  value={bizInfo.address}
                  onChange={(e) => setBizInfo({ ...bizInfo, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* Step 2: Business Type */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Choose Business Category</h2>
              <p className="text-xs text-slate-500">This helps customize inventory defaults and receipt layouts.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'Retail', title: 'Retail Shop', kh: 'ហាងលក់រាយ' },
                  { id: 'Clothing', title: 'Clothing & Fashion', kh: 'សម្លៀកបំពាក់' },
                  { id: 'Restaurant', title: 'Restaurant', kh: 'ភោជនីយដ្ឋាន' },
                  { id: 'Cafe', title: 'Café & Bakery', kh: 'ហាងកាហ្វេ' },
                  { id: 'Electronics', title: 'Electronics', kh: 'គ្រឿងអេឡិចត្រូនិច' },
                  { id: 'Pharmacy', title: 'Pharmacy', kh: 'ឱសថស្ថាន' },
                  { id: 'Wholesale', title: 'Wholesale Depot', kh: 'ដេប៉ូលក់ដុំ' },
                  { id: 'Service', title: 'Services & Salon', kh: 'សេវាកម្ម' },
                  { id: 'Online', title: 'Online Commerce', kh: 'លក់អនឡាញ' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setBizType(type.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      bizType === type.id
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{type.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{type.kh}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: First Warehouse */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Setup Primary Warehouse</h2>
              <p className="text-xs text-slate-500">Every business needs at least one storage location for inventory tracking.</p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Warehouse Name</label>
                <input
                  type="text"
                  value={warehouseData.name}
                  onChange={(e) => setWarehouseData({ ...warehouseData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Warehouse Code</label>
                <input
                  type="text"
                  value={warehouseData.code}
                  onChange={(e) => setWarehouseData({ ...warehouseData, code: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* Step 4: First Product */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Add Your First Product</h2>
              <p className="text-xs text-slate-500">You can also import more products via CSV at any time later.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">English Name</label>
                  <input
                    type="text"
                    value={productData.name_en}
                    onChange={(e) => setProductData({ ...productData, name_en: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Khmer Name</label>
                  <input
                    type="text"
                    value={productData.name_kh}
                    onChange={(e) => setProductData({ ...productData, name_kh: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">SKU</label>
                  <input
                    type="text"
                    value={productData.sku}
                    onChange={(e) => setProductData({ ...productData, sku: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cost ($)</label>
                  <input
                    type="number"
                    value={productData.cost_price}
                    onChange={(e) => setProductData({ ...productData, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Price ($)</label>
                  <input
                    type="number"
                    value={productData.selling_price}
                    onChange={(e) => setProductData({ ...productData, selling_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Invite Employees */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Invite Team Member (Optional)</h2>
              <p className="text-xs text-slate-500">You can invite your sales cashier or store manager now or later.</p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Employee Full Name</label>
                <input
                  type="text"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Dara Nimol"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Employee Email</label>
                <input
                  type="email"
                  value={employeeEmail}
                  onChange={(e) => setEmployeeEmail(e.target.value)}
                  placeholder="dara@mybusiness.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* Step 6: Payment Configuration */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Payment & Cambodian Bakong KHQR</h2>
              <p className="text-xs text-slate-500">Configure exchange rate and KHQR digital payments.</p>
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">Enable Bakong KHQR Payments</div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Allows customers to scan NBC Bakong QR codes at POS.</div>
                </div>
                <input
                  type="checkbox"
                  checked={paymentConfig.enable_khqr}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, enable_khqr: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 rounded-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">USD to KHR Exchange Rate</label>
                <input
                  type="number"
                  value={paymentConfig.khr_exchange_rate}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, khr_exchange_rate: parseFloat(e.target.value) || 4100 })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Default official exchange rate in Cambodia: 4,100 KHR = $1 USD</span>
              </div>
            </div>
          )}

          {/* Step 7: Finish */}
          {currentStep === 7 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">All Set! Your Business is Ready</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Congratulations, your store environment has been prepared. You can now access your dashboard, POS register, inventory, and analytics.
              </p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            {currentStep === totalSteps ? (loading ? 'Launching...' : 'Launch Business Dashboard') : 'Continue'}
            {currentStep !== totalSteps && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
