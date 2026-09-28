import React, { useState, useEffect } from 'react';
import {
  Settings, Building2, DollarSign, QrCode, Send, Users,
  CreditCard, ShieldCheck, Check, Save, Plus, Trash2, AlertCircle, RefreshCw
} from 'lucide-react';
import { orgApi, userApi, subscriptionApi } from '../../api/services';
import { Organization, OrganizationSettings, User, SubscriptionPlan } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';

export const SettingsPage: React.FC = () => {
  const { user, tenant, refreshProfile } = useAuth();
  const { formatMoney, setExchangeRate: updateGlobalExchangeRate } = useCurrency();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'business' | 'tax' | 'khqr' | 'telegram' | 'users' | 'subscription'>('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);

  // Organization info form
  const [orgName, setOrgName] = useState('');
  const [businessType, setBusinessType] = useState('Retail');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('Phnom Penh');
  const [currency, setCurrency] = useState('USD');

  // Organization settings form
  const [taxNumber, setTaxNumber] = useState('');
  const [defaultTaxRate, setDefaultTaxRate] = useState(10.0);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [quotationPrefix, setQuotationPrefix] = useState('QUO-');
  const [poPrefix, setPoPrefix] = useState('PO-');
  const [khrExchangeRate, setKhrExchangeRate] = useState(4100.0);
  const [invoiceFooterEn, setInvoiceFooterEn] = useState('');
  const [invoiceFooterKh, setInvoiceFooterKh] = useState('');

  // KHQR settings
  const [enableKhqr, setEnableKhqr] = useState(true);
  const [khqrMerchantName, setKhqrMerchantName] = useState('');
  const [khqrMerchantCity, setKhqrMerchantCity] = useState('Phnom Penh');
  const [khqrMerchantId, setKhqrMerchantId] = useState('');

  // Telegram settings
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [testingTelegram, setTestingTelegram] = useState(false);

  // Users tab state
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Sales Staff');

  // Subscription state
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [currentOrg, provList, userList, roleList, planList, usageData, curSub] = await Promise.all([
        orgApi.getCurrent(),
        orgApi.getProvinces(),
        userApi.listUsers(),
        userApi.listRoles(),
        subscriptionApi.listPlans(),
        subscriptionApi.getUsage(),
        subscriptionApi.getCurrent()
      ]);

      setProvinces(provList || []);
      setUsers(userList || []);
      setRoles(roleList || []);
      setPlans(planList || []);
      setUsage(usageData);
      setCurrentPlan(curSub);

      if (currentOrg) {
        setOrgName(currentOrg.name || '');
        setBusinessType(currentOrg.business_type || 'Retail');
        setOwnerName(currentOrg.owner_name || '');
        setPhone(currentOrg.phone || '');
        setEmail(currentOrg.email || '');
        setAddress(currentOrg.address || '');
        setProvince(currentOrg.province || 'Phnom Penh');
        setCurrency(currentOrg.currency || 'USD');

        if (currentOrg.settings) {
          const s = currentOrg.settings;
          setTaxNumber(s.tax_number || '');
          setDefaultTaxRate(s.default_tax_rate ?? 10.0);
          setTaxEnabled(s.tax_enabled ?? true);
          setInvoicePrefix(s.invoice_prefix || 'INV-');
          setQuotationPrefix(s.quotation_prefix || 'QUO-');
          setPoPrefix(s.po_prefix || 'PO-');
          setKhrExchangeRate(s.khr_exchange_rate ?? 4100.0);
          setInvoiceFooterEn(s.invoice_footer_en || '');
          setInvoiceFooterKh(s.invoice_footer_kh || '');

          setEnableKhqr(s.enable_khqr ?? true);
          setKhqrMerchantName(s.khqr_merchant_name || currentOrg.name || '');
          setKhqrMerchantCity(s.khqr_merchant_city || 'Phnom Penh');
          setKhqrMerchantId(s.khqr_merchant_id || '');

          setTelegramEnabled(s.telegram_notifications_enabled ?? false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await orgApi.updateCurrent({
        name: orgName,
        business_type: businessType,
        owner_name: ownerName,
        phone,
        email,
        address,
        province,
        currency
      });
      alert('Business information updated!');
      if (refreshProfile) refreshProfile();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update business');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await orgApi.updateSettings({
        tax_number: taxNumber,
        default_tax_rate: defaultTaxRate,
        tax_enabled: taxEnabled,
        invoice_prefix: invoicePrefix,
        quotation_prefix: quotationPrefix,
        po_prefix: poPrefix,
        khr_exchange_rate: khrExchangeRate,
        invoice_footer_en: invoiceFooterEn,
        invoice_footer_kh: invoiceFooterKh,
        enable_khqr: enableKhqr,
        khqr_merchant_name: khqrMerchantName,
        khqr_merchant_city: khqrMerchantCity,
        khqr_merchant_id: khqrMerchantId,
        telegram_notifications_enabled: telegramEnabled,
        telegram_bot_token: telegramBotToken || undefined,
        telegram_chat_id: telegramChatId || undefined
      });
      updateGlobalExchangeRate(khrExchangeRate);
      alert('System settings saved successfully!');
      if (refreshProfile) refreshProfile();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    try {
      const res = await orgApi.testTelegram();
      alert(res.message || 'Telegram test message dispatched!');
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Telegram test delivery failed');
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userApi.createUser({
        full_name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        roles: [newUserRole]
      });
      alert('User invited / created successfully!');
      setIsUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      const updatedUsers = await userApi.listUsers();
      setUsers(updatedUsers || []);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate and remove this user?')) return;
    try {
      await userApi.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleUpgradePlan = async (slug: string) => {
    if (!confirm(`Upgrade to the ${slug.toUpperCase()} plan?`)) return;
    try {
      await subscriptionApi.upgrade(slug);
      alert(`Upgraded to ${slug} plan successfully!`);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to upgrade plan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {t('settings')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure business profile, currency rates, Bakong KHQR, Telegram alerts, team access, and subscription tiers
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('business')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'business'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Business Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('tax')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'tax'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Financial & Tax</span>
        </button>

        <button
          onClick={() => setActiveTab('khqr')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'khqr'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Bakong KHQR</span>
        </button>

        <button
          onClick={() => setActiveTab('telegram')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'telegram'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Telegram Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'users'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Roles</span>
        </button>

        <button
          onClick={() => setActiveTab('subscription')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'subscription'
              ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Subscription & Limits</span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. BUSINESS PROFILE TAB */}
      {activeTab === 'business' && (
        <form onSubmit={handleSaveBusiness} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Business Legal / Brand Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Business Type / Sector
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Retail">Retail Store (ហាងលក់រាយ)</option>
                <option value="Restaurant">Restaurant & Food (ភោជនីយដ្ឋាន)</option>
                <option value="Clothing">Clothing & Fashion (ហាងសម្លៀកបំពាក់)</option>
                <option value="Pharmacy">Pharmacy (ឱសថស្ថាន)</option>
                <option value="Wholesale">Wholesale & Distribution (បោះដុំ)</option>
                <option value="Service">Services (សេវាកម្ម)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Owner Full Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Business Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Business Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Province / Municipality
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {provinces.map(p => (
                  <option key={p.en} value={p.en}>{p.en} ({p.kh})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Physical Street Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. St 214, Sangkat Boeung Raing, Khan Daun Penh"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-emerald-600/30 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Business Profile'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 2. FINANCIAL & TAX TAB */}
      {activeTab === 'tax' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                KHR Exchange Rate (1 USD = ? KHR)
              </label>
              <input
                type="number"
                step="10"
                value={khrExchangeRate}
                onChange={(e) => setKhrExchangeRate(parseFloat(e.target.value) || 4100)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">National Bank of Cambodia benchmark: ~4,100 KHR</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                VAT / Tax ID (General Department of Taxation)
              </label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="e.g. K008-902187654"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Standard VAT Rate (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="enableTax"
                checked={taxEnabled}
                onChange={(e) => setTaxEnabled(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
              />
              <label htmlFor="enableTax" className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Apply VAT tax calculation to POS sales invoices
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Quotation Prefix
              </label>
              <input
                type="text"
                value={quotationPrefix}
                onChange={(e) => setQuotationPrefix(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Purchase Order Prefix
              </label>
              <input
                type="text"
                value={poPrefix}
                onChange={(e) => setPoPrefix(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-emerald-600/30 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Financial Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. BAKONG KHQR TAB */}
      {activeTab === 'khqr' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 max-w-3xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">National Bakong KHQR Gateway</h2>
              <p className="text-[11px] text-slate-400">Accept mobile QR payments from ABA, Acleda, Canadia, Wing, and all Bakong apps</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableKhqrCheck"
                checked={enableKhqr}
                onChange={(e) => setEnableKhqr(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
              />
              <label htmlFor="enableKhqrCheck" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                KHQR Active
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Bakong Merchant Name (Displayed on Customer's Screen)
              </label>
              <input
                type="text"
                value={khqrMerchantName}
                onChange={(e) => setKhqrMerchantName(e.target.value)}
                placeholder="e.g. KHMER STYLE FASHION"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Merchant City
              </label>
              <input
                type="text"
                value={khqrMerchantCity}
                onChange={(e) => setKhqrMerchantCity(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Bakong Account ID / Merchant ID
            </label>
            <input
              type="text"
              value={khqrMerchantId}
              onChange={(e) => setKhqrMerchantId(e.target.value)}
              placeholder="e.g. khmerstyle@aba or 012345678@aclb"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-emerald-600/30 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save KHQR Configuration'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 4. TELEGRAM ALERTS TAB */}
      {activeTab === 'telegram' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 max-w-3xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Telegram Bot Notifications</h2>
              <p className="text-[11px] text-slate-400">Receive instant sales vouchers, low-stock alerts, and daily summaries to your Telegram group</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableTelegramCheck"
                checked={telegramEnabled}
                onChange={(e) => setTelegramEnabled(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
              />
              <label htmlFor="enableTelegramCheck" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Alerts Enabled
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Telegram Bot Token (from @BotFather)
            </label>
            <input
              type="password"
              value={telegramBotToken}
              onChange={(e) => setTelegramBotToken(e.target.value)}
              placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Leave empty to use system default / mock simulation</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Target Chat ID / Channel Group ID
            </label>
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="e.g. -1001234567890 or @mybusinesschannel"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={testingTelegram}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-xl shadow-xs"
            >
              <Send className={`w-3.5 h-3.5 ${testingTelegram ? 'animate-pulse' : ''}`} />
              <span>{testingTelegram ? 'Dispatching...' : 'Send Test Notification'}</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-emerald-600/30 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Telegram Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 5. USERS & ROLES TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Team Members & Permissions</h2>
              <p className="text-[11px] text-slate-400">Manage business users and granular role-based authorization</p>
            </div>
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-emerald-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Invite New User</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {u.full_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-medium text-[11px]">
                        {u.roles?.[0]?.name || (u.is_super_admin ? 'Super Admin' : 'Member')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={u.is_active ? 'success' : 'danger'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="Remove user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SUBSCRIPTION & USAGE TAB */}
      {activeTab === 'subscription' && (
        <div className="space-y-6 max-w-4xl">
          {/* Current Plan Overview */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/10 via-emerald-900/5 to-teal-900/10 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-200/60 dark:border-emerald-800/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Current Plan
              </span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {currentPlan?.plan?.name || 'Starter Plan'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Status: <span className="font-semibold text-emerald-600">Active</span> • Auto-renews monthly
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                ${currentPlan?.plan?.price_usd || 19}
              </span>
              <span className="text-xs text-slate-400">/month</span>
            </div>
          </div>

          {/* Usage Gauges */}
          {usage && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                <span className="text-xs font-medium text-slate-500">Users Limit</span>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {usage.users.used} / {usage.users.max === -1 ? 'Unlimited' : usage.users.max}
                </p>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, (usage.users.used / (usage.users.max || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                <span className="text-xs font-medium text-slate-500">Products Catalog</span>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {usage.products.used} / {usage.products.max === -1 ? 'Unlimited' : usage.products.max}
                </p>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, (usage.products.used / (usage.products.max || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                <span className="text-xs font-medium text-slate-500">Warehouses</span>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {usage.warehouses.used} / {usage.warehouses.max === -1 ? 'Unlimited' : usage.warehouses.max}
                </p>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${Math.min(100, (usage.warehouses.used / (usage.warehouses.max || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Available Plans for Upgrade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {plans.map(p => {
              const isCurrent = currentPlan?.plan?.slug === p.slug;
              return (
                <div
                  key={p.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.name}</h3>
                      {isCurrent && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-full">CURRENT</span>}
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
                      ${p.price_usd} <span className="text-xs font-normal text-slate-400">/mo</span>
                    </div>
                    <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Up to {p.max_users === -1 ? 'Unlimited' : p.max_users} Users</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Up to {p.max_products === -1 ? 'Unlimited' : p.max_products} Products</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{p.max_warehouses === -1 ? 'Multi' : p.max_warehouses} Warehouse(s)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>KHQR & Telegram Alerts</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleUpgradePlan(p.slug)}
                    disabled={isCurrent}
                    className={`w-full mt-6 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isCurrent
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/30'
                    }`}
                  >
                    {isCurrent ? 'Current Tier' : `Switch to ${p.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Invite User */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Invite Team Member"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="e.g. Dara Vuthy"
              required
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Login Email
            </label>
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="dara@khmerstyle.com"
              required
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Temporary Password
            </label>
            <input
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Security Role
            </label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="Business Admin">Business Admin</option>
              <option value="Manager">Manager</option>
              <option value="Sales Staff">Sales Staff (POS)</option>
              <option value="Inventory Staff">Inventory Staff</option>
              <option value="Accountant">Accountant</option>
              <option value="HR Staff">HR Staff</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs shadow-emerald-600/30"
            >
              Add Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
