import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Plus, CheckCircle, Clock, Truck, Ban } from 'lucide-react';
import { inventoryApi, warehouseApi, productApi } from '../../api/services';
import { Warehouse, Product } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const StockTransferPage: React.FC = () => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [fromWh, setFromWh] = useState('');
  const [toWh, setToWh] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [tList, wList, pList] = await Promise.all([
        inventoryApi.listTransfers(),
        warehouseApi.listWarehouses(),
        productApi.listProducts({ size: 100 })
      ]);
      setTransfers(tList || []);
      setWarehouses(wList || []);
      setProducts(pList.items || []);

      if (wList && wList.length > 1) {
        setFromWh(wList[0].id);
        setToWh(wList[1].id);
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

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('Please select a product to transfer');
      return;
    }
    if (fromWh === toWh) {
      alert('Source and destination warehouse must be different');
      return;
    }

    try {
      await inventoryApi.createTransfer({
        from_warehouse_id: fromWh,
        to_warehouse_id: toWh,
        notes,
        items: [{ product_id: selectedProduct, quantity }]
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create transfer');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await inventoryApi.updateTransferStatus(id, status);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Status update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Warehouse Stock Transfers
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dispatch inventory between branch warehouses with multi-stage fulfillment tracking
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Transfer</span>
        </button>
      </div>

      {/* Transfers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Transfer Number</th>
                <th className="py-3.5 px-4">From Warehouse</th>
                <th className="py-3.5 px-4">To Warehouse</th>
                <th className="py-3.5 px-4">Items Count</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Fulfillment Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No stock transfers found.</td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {t.transfer_number}
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      {t.from_warehouse_name}
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      {t.to_warehouse_name}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.items?.length || 0} product(s)
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          t.status === 'Received'
                            ? 'success'
                            : t.status === 'In Transit'
                            ? 'warning'
                            : t.status === 'Approved'
                            ? 'info'
                            : t.status === 'Cancelled'
                            ? 'danger'
                            : 'neutral'
                        }
                      >
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {t.status === 'Draft' && (
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'Approved')}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100 mr-2"
                        >
                          Approve
                        </button>
                      )}
                      {t.status === 'Approved' && (
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'In Transit')}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 hover:bg-amber-100 mr-2"
                        >
                          Ship / Dispatch
                        </button>
                      )}
                      {t.status === 'In Transit' && (
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'Received')}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                        >
                          Receive & Restock
                        </button>
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
        title="Initiate Stock Transfer"
        maxWidth="md"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Origin Warehouse *
              </label>
              <select
                value={fromWh}
                onChange={(e) => setFromWh(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destination Warehouse *
              </label>
              <select
                value={toWh}
                onChange={(e) => setToWh(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Product *
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            >
              <option value="">-- Choose Product --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name_en} ({p.sku})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transfer Quantity *
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
            />
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
              Create Transfer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
