import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import CategoryIcon from './CategoryIcon';

const CHART_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#64748b', '#a16207',
];

const fmtARS = (v: number) =>
  Math.abs(v) >= 1_000_000
    ? `${v < 0 ? '-' : ''}$${(Math.abs(v) / 1_000_000).toFixed(1)}M`
    : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const fmtUSD = (v: number) =>
  Math.abs(v) >= 1_000_000
    ? `${v < 0 ? '-' : ''}$${(Math.abs(v) / 1_000_000).toFixed(1)}M`
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

export interface DonutSlice {
  label: string;
  valueARS: number;
  valueUSD: number;
  icon?: string;
}

interface Props {
  slices: DonutSlice[];
  totalARS: number;
  totalUSD: number;
  emptyMessage?: string;
  layout?: 'vertical' | 'horizontal';
  currency?: 'ARS' | 'USD';
  onCurrencyChange?: (c: 'ARS' | 'USD') => void;
}

export default function CategoryDonutChart({
  slices, totalARS, totalUSD, emptyMessage = 'Sin datos', layout = 'vertical',
  currency: controlledCurrency, onCurrencyChange,
}: Props) {
  const [internalCurrency, setInternalCurrency] = useState<'ARS' | 'USD'>('ARS');
  const currency = controlledCurrency ?? internalCurrency;
  const setCurrency = (c: 'ARS' | 'USD') => {
    setInternalCurrency(c);
    onCurrencyChange?.(c);
  };
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const isARS = currency === 'ARS';
  const fmt = isARS ? fmtARS : fmtUSD;
  const total = isARS ? totalARS : totalUSD;

  const data = slices
    .map((sl, i) => ({
      ...sl,
      value: isARS ? sl.valueARS : sl.valueUSD,
      color: CHART_COLORS[i % CHART_COLORS.length],
      pct: 0,
    }))
    .filter(sl => sl.value > 0)
    .sort((a, b) => b.value - a.value)
    .map(sl => ({ ...sl, pct: total > 0 ? Math.round((sl.value / total) * 100) : 0 }));

  const activeSeg = activeIndex !== null ? data[activeIndex] : null;

  const toggle = (
    <div className="inline-flex self-center items-center bg-stone-100 dark:bg-stone-800 rounded-full p-1 gap-0.5">
      {(['ARS', 'USD'] as const).map(c => (
        <button
          key={c}
          onClick={() => setCurrency(c)}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 ${
            currency === c
              ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-sm'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );

  const donut = (
    <div className="relative flex-shrink-0" style={{ width: 176, height: 176 }}>
      {total === 0 ? (
        <>
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="72" fill="none"
              stroke="currentColor" strokeWidth="22"
              className="text-stone-100 dark:text-stone-800" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-stone-400 dark:text-stone-500 text-center px-6 leading-tight">{emptyMessage}</span>
          </div>
        </>
      ) : (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={72}
                paddingAngle={2}
                dataKey="value"
                startAngle={90} endAngle={-270}
                strokeWidth={0}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.color}
                    opacity={activeIndex === null || activeIndex === i ? 1 : 0.35}
                    style={{ cursor: 'pointer', outline: 'none' }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {activeSeg ? (
              <>
                <span className="text-[10px] text-stone-400 dark:text-stone-500 leading-none mb-0.5 text-center px-2 truncate w-full text-center">
                  {activeSeg.label}
                </span>
                <span className="text-sm font-bold text-stone-900 dark:text-stone-50 leading-tight">
                  {fmt(activeSeg.value)}
                </span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500 leading-none mt-0.5">
                  {activeSeg.pct}%
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-semibold tracking-wide text-stone-400 dark:text-stone-500 leading-none mb-1">{currency}</span>
                <span className="text-base font-bold text-stone-900 dark:text-stone-50 text-center px-3 leading-tight">
                  {fmt(total)}
                </span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );

  const legend = (
    <div className={`space-y-2 ${layout === 'horizontal' ? 'flex-1 min-w-0' : 'w-full px-1'}`}>
      {data.map((seg, i) => (
        <div
          key={i}
          className={`flex items-center gap-2.5 transition-opacity duration-150 cursor-default ${
            activeIndex !== null && activeIndex !== i ? 'opacity-30' : 'opacity-100'
          }`}
          onMouseEnter={() => setActiveIndex(i)}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: seg.color + '28' }}
          >
            {seg.icon ? (
              <CategoryIcon icon={seg.icon} size={16} className="text-stone-700 dark:text-stone-200" />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-xs font-medium text-stone-700 dark:text-stone-300 truncate">{seg.label}</span>
              <span className="text-xs text-stone-400 dark:text-stone-500 flex-shrink-0">{seg.pct}%</span>
            </div>
            <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex-shrink-0 min-w-[52px] text-right">
            {fmt(seg.value)}
          </span>
        </div>
      ))}
    </div>
  );

  if (layout === 'horizontal') {
    return (
      <div className="flex flex-col gap-3 py-2">
        {toggle}
        <div className="flex items-center gap-6">
          {donut}
          {legend}
        </div>
      </div>
    );
  }

  // vertical (mobile)
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {toggle}
      {donut}
      {data.length > 0 && legend}
    </div>
  );
}
