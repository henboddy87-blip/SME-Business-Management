import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { inventoryApi, productApi, warehouseApi } from '../../api/services';
import { Product, Warehouse } from '../../types';
import { Modal } from '../../components/common/Modal';

export const StockAdjustmentPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    warehouse_id: '',
    product_id: '',
    quantity_adjusted: 0,
    reason: 'Damaged products',
    notes: '',
  });

  const loadData = async () => {
    try {
      const [pRes, wRes, movements] = await Promise.all([
        productApi.listProducts({ size: 100 }),
        warehouseApi.listWarehouses(),
        inventoryApi.getMovements({ movement_type: 'Stock Adjustment' })
      ]);
      setProducts(pRes.items || []);
      setWarehouses(wRes || []);
      setAdjustments(movements || []);
      if (wRes && wRes.length > 0 && !formData.warehouse_id) {
        setFormData(prev => ({ ...prev, warehouse_id: wRes[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id) {
      alert('Please select a product');
      return;
    }
    setLoading(true);
    try {
      await inventoryApi.adjustStock(formData);
      setIsModalOpen(false);
      setFormData({
        warehouse_id: warehouses[0]?.id || '',
        product_id: '',
        quantity_adjusted: 0,
        reason: 'Damaged products',
        notes: '',
      });
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Stock Adjustments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manual stock corrections for shrinkage, damages, or discrepancies with audit tracking
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Adjustment</span>
        </button>
      </div>

      {/* Adjustments History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Warehouse</th>
                <th className="py-3.5 px-4">Adjustment Qty</th>
                <th className="py-3.5 px-4">Previous → New</th>
                <th className="py-3.5 px-4">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {adjustments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">No stock adjustments recorded yet.</td>
                </tr>
              ) : (
                adjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {a.product_name} <span className="font-mono text-slate-400 font-normal">({a.product_sku})</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {a.warehouse_name}
                    </td>
                    <td className={`py-3.5 px-4 font-bold font-mono ${a.quantity >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {a.quantity > 0 ? `+${a.quantity}` : a.quantity}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {a.previous_quantity} → <span className="font-semibold text-slate-900 dark:text-slate-100">{a.new_quantity}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {a.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Perform Stock Adjustment"
        maxWidth="md"
      >
        <form onSubmit={handleAdjust} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Warehouse *
            </label>
            <select
              value={formData.warehouse_id}
              onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Product *
            </label>
            <select
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            >
              <option value="">-- Choose Product --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name_en} ({p.sku}) [Current: {p.total_stock}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Quantity Adjustment (+ or -) *
            </label>
            <input
              type="number"
              step="1"
              required
              value={formData.quantity_adjusted}
              onChange={(e) => setFormData({ ...formData, quantity_adjusted: parseFloat(e.target.value) || 0 })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Enter positive number to add stock (e.g. +5) or negative to write off (e.g. -3).
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Adjustment *
            </label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            >
              <option value="Damaged products">Damaged products / ទំនិញខូចគុណភាព</option>
              <option value="Expired stock">Expired stock / ផុតកំណត់កាលបរិច្ឆេទ</option>
              <option value="Physical count discrepancy">Physical count discrepancy / រាប់ឃើញខ្វះ-លើស</option>
              <option value="Inventory write-off">Inventory write-off / ការកាត់កាតព្វកិច្ច</option>
              <option value="Showroom sample">Showroom sample / គំរូដាក់តាំង</option>
              <option value="Other">Other / ផ្សេងៗ</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
            >
              {loading ? 'Adjusting...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
