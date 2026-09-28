import React, { useState, useEffect } from 'react';
import {
  Search, ShoppingCart, Trash2, Plus, Minus, CreditCard,
  QrCode, Banknote, Building2, UserPlus, CheckCircle,
  Printer, RefreshCw, X, AlertCircle
} from 'lucide-react';
import { productApi, warehouseApi, partnerApi, saleApi } from '../../api/services';
import { Product, Warehouse, Customer, Sale } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  unit_price: number;
}

export const POSPage: React.FC = () => {
  const { t } = useLanguage();
  const { formatMoney, currency, exchangeRate } = useCurrency();
  const { tenant } = useAuth();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(10.0); // 10% VAT

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'KHQR' | 'Bank Transfer' | 'Card'>('Cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // KHQR state
  const [khqrData, setKhqrData] = useState<any>(null);
  const [khqrVerified, setKhqrVerified] = useState(false);
  const [isGeneratingKhqr, setIsGeneratingKhqr] = useState(false);

  // Receipt Modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    const init = async () => {
      try {
        const [pRes, wRes, cRes] = await Promise.all([
          productApi.listProducts({ size: 100 }),
          warehouseApi.listWarehouses(),
          partnerApi.listCustomers()
        ]);
        setProducts(pRes.items || []);
        setWarehouses(wRes || []);
        setCustomers(cRes || []);

        if (wRes && wRes.length > 0) {
          const defaultWh = wRes.find(w => w.is_default) || wRes[0];
          setSelectedWarehouseId(defaultWh.id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name_en.toLowerCase().includes(search.toLowerCase()) ||
                          (p.name_kh && p.name_kh.includes(search)) ||
                          p.sku.toLowerCase().includes(search.toLowerCase()) ||
                          (p.barcode && p.barcode.includes(search));
    const matchesCat = categoryFilter === 'All' || (p.category && p.category.name_en === categoryFilter);
    return matchesSearch && matchesCat && p.status === 'active';
  });

  // Cart operations
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, discount: 0, unit_price: product.selling_price }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setOrderDiscount(0);
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.quantity * item.unit_price) - item.discount, 0);
  const taxableAmount = Math.max(0, subtotal - orderDiscount);
  const taxAmount = (taxableAmount * taxRate) / 100.0;
  const grandTotal = taxableAmount + taxAmount;
  const grandTotalKhr = grandTotal * exchangeRate;

  // Open Payment Modal
  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setCashReceived(grandTotal);
    setKhqrVerified(false);
    setKhqrData(null);
    setIsPaymentModalOpen(true);
  };

  // Generate Bakong KHQR
  const handleGenerateKhqr = async () => {
    setIsGeneratingKhqr(true);
    try {
      const res = await saleApi.generateKhqr({
        amount: grandTotal,
        currency: 'USD',
        invoice_number: `POS-${Date.now().toString().slice(-4)}`
      });
      setKhqrData(res);
      // Auto verify in demo after 2 seconds
      setTimeout(() => {
        setKhqrVerified(true);
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingKhqr(false);
    }
  };

  // Complete Sale
  const handleCompleteSale = async () => {
    setIsProcessing(true);
    try {
      const payload = {
        customer_id: selectedCustomerId || undefined,
        warehouse_id: selectedWarehouseId,
        discount_amount: orderDiscount,
        tax_rate: taxRate,
        currency: 'USD',
        exchange_rate: exchangeRate,
        payment_method: paymentMethod,
        paid_amount: paymentMethod === 'Cash' ? cashReceived : grandTotal,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount
        }))
      };

      const sale = await saleApi.completeSale(payload);
      setCompletedSale(sale);
      setIsPaymentModalOpen(false);
      setIsReceiptModalOpen(true);
      clearCart();

      // Refresh product stock
      const pRes = await productApi.listProducts({ size: 100 });
      setProducts(pRes.items || []);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to complete sale');
    } finally {
      setIsProcessing(false);
    }
  };

  const changeDue = Math.max(0, cashReceived - grandTotal);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6.5rem)] overflow-hidden">
      {/* LEFT: Products Catalogue & Scanner */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        {/* Top Controls: Warehouse selector & Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">{t('selectWarehouse')}:</span>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['All', "Men's Clothing", "Women's Clothing", 'Shoes', 'Bags', 'Accessories'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg shrink-0 transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchProductPlaceholder')}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((p) => {
              const inStock = p.total_stock > 0;
              return (
                <button
                  key={p.id}
                  disabled={!inStock}
                  onClick={() => addToCart(p)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    inStock
                      ? 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md cursor-pointer'
                      : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800/50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-mono">{p.sku}</span>
                      <span className={inStock ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold'}>
                        {inStock ? `${p.total_stock} in stock` : 'Out of Stock'}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                      {p.name_en}
                    </div>
                    {p.name_kh && (
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-khmer">
                        {p.name_kh}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(p.selling_price)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ៛{Math.round(p.selling_price * exchangeRate).toLocaleString()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Active Cart Summary */}
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs shrink-0">
        {/* Customer Select Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('selectCustomer')}
            </span>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline"
              >
                Clear Cart
              </button>
            )}
          </div>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
          >
            <option value="">{t('walkInCustomer')}</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''} {c.outstanding_balance > 0 ? `[Bal: $${c.outstanding_balance}]` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
              <ShoppingCart className="w-10 h-10 mb-2 stroke-1 text-slate-300 dark:text-slate-600" />
              <p className="text-xs">{t('emptyCart')}</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {item.product.name_en}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {formatMoney(item.unit_price)} × {item.quantity} = {formatMoney((item.quantity * item.unit_price) - item.discount)}
                  </div>
                </div>

                {/* Counter controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-slate-900 dark:text-slate-100">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals & Checkout Button */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>{t('subtotal')}</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatMoney(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span>{t('discount')} ($)</span>
            </span>
            <input
              type="number"
              min="0"
              value={orderDiscount}
              onChange={(e) => setOrderDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-16 px-1.5 py-0.5 text-right text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>{t('tax')}</span>
            <span className="font-semibold">{formatMoney(taxAmount)}</span>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">{t('total')}</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {formatMoney(grandTotal)}
              </div>
            </div>
            <div className="text-right font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ៛{Math.round(grandTotalKhr).toLocaleString()}
            </div>
          </div>

          <button
            onClick={handleOpenPayment}
            disabled={cart.length === 0}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>{t('payNow')}</span>
          </button>
        </div>
      </div>

      {/* PAYMENT MODAL (Cash, Bakong KHQR, Bank Transfer, Card) */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={t('payNow')}
        maxWidth="lg"
      >
        <div className="space-y-5">
          {/* Total display */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                Amount to Collect
              </div>
              <div className="text-2xl font-bold text-emerald-950 dark:text-emerald-100">
                {formatMoney(grandTotal)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Cambodian Riel</div>
              <div className="text-lg font-bold font-mono text-emerald-800 dark:text-emerald-200">
                ៛{Math.round(grandTotalKhr).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Cash', label: t('cash'), icon: Banknote },
                { id: 'KHQR', label: t('khqr'), icon: QrCode },
                { id: 'Bank Transfer', label: t('bankTransfer'), icon: Building2 },
                { id: 'Card', label: t('card'), icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'Cash' && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cash Received ($ USD)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-base font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Quick cash denomination buttons */}
              <div className="flex gap-2">
                {[10, 20, 50, 100].map(den => (
                  <button
                    key={den}
                    type="button"
                    onClick={() => setCashReceived(den)}
                    className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
                  >
                    ${den}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">{t('change')}:</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {formatMoney(changeDue)} (៛{Math.round(changeDue * exchangeRate).toLocaleString()})
                </span>
              </div>
            </div>
          )}

          {/* Bakong KHQR Payment Details */}
          {paymentMethod === 'KHQR' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center space-y-3">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('khqrScanPrompt')}
              </div>

              {!khqrData ? (
                <button
                  type="button"
                  onClick={handleGenerateKhqr}
                  disabled={isGeneratingKhqr}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 mx-auto"
                >
                  <QrColorIcon className="w-4 h-4" />
                  {isGeneratingKhqr ? 'Generating KHQR...' : 'Generate Bakong KHQR Code'}
                </button>
              ) : (
                <div className="space-y-3">
                  {/* Bakong QR Visualizer */}
                  <div className="w-48 h-48 mx-auto p-3 bg-white rounded-2xl border-4 border-red-600 shadow-md flex flex-col items-center justify-between">
                    <div className="text-[10px] font-bold tracking-widest text-red-600 uppercase">
                      KHQR • BAKONG
                    </div>
                    {/* Simulated SVG QR Matrix */}
                    <div className="w-32 h-32 bg-slate-900 rounded-lg flex items-center justify-center p-2">
                      <QrCode className="w-28 h-28 text-white stroke-1" />
                    </div>
                    <div className="text-[9px] font-mono text-slate-500">
                      {khqrData.merchant_name}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs font-semibold">
                    {khqrVerified ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Payment Verified via NBC Bakong Network!
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Waiting for customer payment scan...
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleCompleteSale}
              disabled={isProcessing || (paymentMethod === 'Cash' && cashReceived < grandTotal)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? 'Processing Transaction...' : t('completeSale')}
            </button>
          </div>
        </div>
      </Modal>

      {/* PRINTABLE RECEIPT / INVOICE MODAL */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Sale Receipt & Tax Invoice"
        maxWidth="md"
      >
        {completedSale && (
          <div className="space-y-4 text-xs font-sans">
            {/* Printable Receipt Body */}
            <div id="pos-printable-receipt" className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl print-shadow-none">
              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1">
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {tenant?.name || 'Khmer Style Fashion'}
                </div>
                <div className="text-[11px] text-slate-500 font-khmer">
                  {tenant?.province || 'Phnom Penh'}, Cambodia
                </div>
                <div className="text-[10px] text-slate-400">
                  Tel: {tenant?.phone || '+855 23 888 777'}
                </div>
                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  INVOICE #{completedSale.invoice_number}
                </div>
              </div>

              {/* Items */}
              <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                <div className="flex font-semibold text-slate-400 text-[10px] uppercase">
                  <span className="flex-1">Item</span>
                  <span className="w-12 text-center">Qty</span>
                  <span className="w-16 text-right">Price</span>
                  <span className="w-16 text-right">Total</span>
                </div>
                {completedSale.items.map((it, idx) => (
                  <div key={idx} className="flex text-slate-800 dark:text-slate-200">
                    <span className="flex-1 truncate">{it.product_name}</span>
                    <span className="w-12 text-center">{it.quantity}</span>
                    <span className="w-16 text-right">${it.unit_price.toFixed(2)}</span>
                    <span className="w-16 text-right font-medium">${it.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>${completedSale.subtotal.toFixed(2)}</span>
                </div>
                {completedSale.discount_amount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Discount:</span>
                    <span>-${completedSale.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Tax (10% VAT):</span>
                  <span>${completedSale.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-slate-100 pt-1">
                  <span>Total (USD):</span>
                  <span>${completedSale.total_amount_usd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-mono font-bold text-xs text-emerald-600">
                  <span>Total (KHR):</span>
                  <span>៛{Math.round(completedSale.total_amount_khr).toLocaleString()}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-3 text-[11px] text-slate-400 space-y-0.5">
                <p className="font-khmer">សូមអរគុណចំពោះការគាំទ្ររបស់លោកអ្នក!</p>
                <p>Thank you for your business!</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

function QrColorIcon(props: any) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
