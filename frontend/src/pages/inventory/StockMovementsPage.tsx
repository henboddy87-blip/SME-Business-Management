import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Calendar, User, FileText, Filter } from 'lucide-react';
import { inventoryApi } from '../../api/services';
import { StockMovement } from '../../types';
import { Badge } from '../../components/common/Badge';

export const StockMovementsPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  const loadMovements = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getMovements({ movement_type: typeFilter || undefined, limit: 100 });
      setMovements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, [typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Auditable Stock Movements
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete audit ledger of all inventory increments, sales deductions, and adjustments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 shadow-2xs"
          >
            <option value="">All Movement Types</option>
            <option value="Sale">Sale (Outbound)</option>
            <option value="Purchase">Purchase (Inbound)</option>
            <option value="Opening Stock">Opening Stock</option>
            <option value="Stock Adjustment">Stock Adjustment</option>
            <option value="Stock Transfer">Stock Transfer</option>
            <option value="Sales Return">Sales Return</option>
            <option value="Purchase Return">Purchase Return</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Warehouse</th>
                <th className="py-3.5 px-4">Movement Type</th>
                <th className="py-3.5 px-4">Qty Changed</th>
                <th className="py-3.5 px-4">Prev / New</th>
                <th className="py-3.5 px-4">Reason / Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading audit movements...</td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No stock movements recorded yet.</td>
                </tr>
              ) : (
                movements.map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {m.product_name} <span className="font-mono font-normal text-slate-400 text-[11px]">({m.product_sku})</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {m.warehouse_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={isPositive ? 'success' : 'purple'}>
                          {m.movement_type}
                        </Badge>
                      </td>
                      <td className={`py-3.5 px-4 font-bold font-mono ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {m.previous_quantity} → <span className="text-slate-900 dark:text-slate-100 font-semibold">{m.new_quantity}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 truncate max-w-xs">
                        {m.reason || m.reference_id || '-'}
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
