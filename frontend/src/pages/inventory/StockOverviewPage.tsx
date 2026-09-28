import React, { useState, useEffect } from 'react';
import { Layers, Warehouse as WhIcon, ArrowRightLeft, SlidersHorizontal } from 'lucide-react';
import { inventoryApi, warehouseApi } from '../../api/services';
import { Warehouse } from '../../types';
import { Badge } from '../../components/common/Badge';
import { useCurrency } from '../../context/CurrencyContext';

export const StockOverviewPage: React.FC = () => {
  const { formatMoney } = useCurrency();
  const [stockList, setStockList] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWh, setSelectedWh] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStock = async () => {
    setLoading(true);
    try {
      const [stocks, whs] = await Promise.all([
        inventoryApi.getStock(selectedWh || undefined),
        warehouseApi.listWarehouses()
      ]);
      setStockList(stocks);
      setWarehouses(whs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, [selectedWh]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Warehouse Stock Balance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time stock valuation and quantities across storage locations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedWh}
            onChange={(e) => setSelectedWh(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 shadow-2xs"
          >
            <option value="">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Warehouse</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">On Hand Qty</th>
                <th className="py-3.5 px-4">Unit Cost</th>
                <th className="py-3.5 px-4">Total Value</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading stock balances...</td>
                </tr>
              ) : stockList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No stock records found for this location.</td>
                </tr>
              ) : (
                stockList.map((s, idx) => {
                  const statusVar = s.stock_status === 'In Stock' ? 'success' : (s.stock_status === 'Low Stock' ? 'warning' : 'danger');
                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {s.warehouse_name}
                      </td>
                      <td className="py-3.5 px-4">
                        {s.product_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-600 dark:text-emerald-400">
                        {s.product_sku}
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        {s.quantity}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {formatMoney(s.cost_price)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                        {formatMoney(s.total_value)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={statusVar}>{s.stock_status}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
