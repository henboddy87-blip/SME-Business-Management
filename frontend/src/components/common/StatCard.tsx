import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

interface StatCardProps {
  title: string;
  value: number;
  isCurrency?: boolean;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'emerald' | 'amber' | 'rose' | 'sky';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  isCurrency = false,
  subtitle,
  icon: Icon,
  trend,
  color = 'emerald',
}) => {
  const { formatMoney, currency, exchangeRate } = useCurrency();

  const colorStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  };

  const safeValue = typeof value === 'number' && !isNaN(value) ? value : (Number(value) || 0);
  const displayValue = isCurrency ? formatMoney(safeValue) : safeValue.toLocaleString();
  const secondaryDisplay = isCurrency && currency === 'USD' 
    ? `៛${Math.round(safeValue * (exchangeRate || 4100)).toLocaleString()}`
    : (isCurrency && currency === 'KHR' ? `$${safeValue.toFixed(2)}` : null);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
        <div className={`p-2.5 rounded-xl border ${colorStyles[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {displayValue}
        </div>
        {secondaryDisplay && (
          <div className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
            {secondaryDisplay}
          </div>
        )}
      </div>
      {(trend || subtitle) && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          {trend && (
            <span className={`font-semibold flex items-center gap-1 ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-slate-400 dark:text-slate-500 ml-auto">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
};
