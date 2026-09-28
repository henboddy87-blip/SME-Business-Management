import React, { useState, useEffect } from 'react';
import { Truck, Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { purchaseApi, partnerApi, warehouseApi, productApi } from '../../api/services';
import { PurchaseOrder, Supplier, Warehouse, Product } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useCurrency } from '../../context/CurrencyContext';

export const PurchaseOrdersPage: React.FC = () => {
  const { formatMoney } = useCurrency();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receivingId, setReceivingId] = useState<string | null>(null);

  // New PO form state
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState(20);
  const [itemCost, setItemCost] = useState(5.0);
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pos, sups, whs, prods] = await Promise.all([
        purchaseApi.listOrders(),
        partnerApi.listSuppliers(),
        warehouseApi.listWarehouses(),
        productApi.listProducts({ size: 100 })
      ]);
      setOrders(pos || []);
      setSuppliers(sups || []);
      setWarehouses(whs || []);
      setProducts(prods.items || []);

      if (sups.length > 0) setSupplierId(sups[0].id);
      if (whs.length > 0) setWarehouseId(whs[0].id);
      if (prods.items?.length > 0) {
        setSelectedProductId(prods.items[0].id);
        setItemCost(prods.items[0].cost_price || 5.0);
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

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await purchaseApi.createOrder({
        supplier_id: supplierId,
        warehouse_id: warehouseId,
        discount: 0,
        tax: 0,
        notes,
        items: [{ product_id: selectedProductId, quantity: itemQty, unit_cost: itemCost }]
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create PO');
    }
  };

  const handleReceiveGoods = async (poId: string) => {
    if (!confirm('Confirm receiving inventory? This will atomically increase stock in the warehouse and record stock movements.')) return;
    setReceivingId(poId);
    try {
      await purchaseApi.receiveOrder(poId);
      alert('Goods received successfully! Warehouse stock updated.');
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to receive goods');
    } finally {
      setReceivingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Purchase Orders
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supplier procurement orders and verified inventory receiving
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">PO Number</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Destination Warehouse</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No purchase orders found.</td>
                </tr>
              ) : (
                orders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {po.po_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {po.supplier_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {po.warehouse_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatMoney(po.total)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={po.status === 'Received' ? 'success' : 'warning'}>
                        {po.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(po.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {po.status !== 'Received' ? (
                        <button
                          onClick={() => handleReceiveGoods(po.id)}
                          disabled={receivingId === po.id}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{receivingId === po.id ? 'Receiving...' : 'Receive Goods'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Inventory Restocked ✓
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Purchase Order"
        maxWidth="md"
      >
        <form onSubmit={handleCreatePO} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Supplier *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.payment_terms})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Destination Warehouse *
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Product *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const p = products.find(x => x.id === e.target.value);
                if (p) setItemCost(p.cost_price);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name_en} ({p.sku})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={itemQty}
                onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit Cost ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={itemCost}
                onChange={(e) => setItemCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-500">Estimated Total:</span>
            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
              {formatMoney(itemQty * itemCost)}
            </span>
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
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
            >
              Submit Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
