import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { historyService } from '../services/api';
import { HistorySummary, YearlySummary, MonthlySummary } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTH_NAMES_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const formatARS = (n: number) =>
  Math.abs(n) >= 1_000_000
    ? `${n < 0 ? '-' : ''}$${(Math.abs(n) / 1_000_000).toFixed(1)}M`
    : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const formatUSD = (n: number) =>
  Math.abs(n) >= 1_000_000
    ? `${n < 0 ? '-' : ''}$${(Math.abs(n) / 1_000_000).toFixed(1)}M`
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

function YearSelector({ years, selected, onChange }: { years: number[]; selected: number; onChange: (y: number) => void }) {
  const idx = years.indexOf(selected);
  const canPrev = idx < years.length - 1;
  const canNext = idx > 0;
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => canPrev && onChange(years[idx + 1])}
        disabled={!canPrev}
        className="p-1 text-stone-400 disabled:opacity-30 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="text-lg font-bold text-stone-900 dark:text-stone-50 w-16 text-center">{selected}</span>
      <button
        onClick={() => canNext && onChange(years[idx - 1])}
        disabled={!canNext}
        className="p-1 text-stone-400 disabled:opacity-30 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

function MonthCard({ data, isMobile }: { data: MonthlySummary; isMobile: boolean }) {
  const netARS = data.incomeARS - data.expensesARS;
  const positive = netARS >= 0;
  const monthLabel = isMobile ? MONTH_NAMES[data.month - 1] : MONTH_NAMES_FULL[data.month - 1];
  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">{monthLabel}</p>
        <p className={`text-xs font-semibold truncate ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
          {positive ? '+' : ''}{formatARS(netARS)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
          <p className="text-[10px] text-stone-500 dark:text-stone-400 mb-0.5">Gastos</p>
          <p className="text-xs font-semibold text-red-700 dark:text-red-400">{formatARS(data.expensesARS)}</p>
          {data.expensesUSD > 0 && <p className="text-[10px] text-red-400 mt-0.5">{formatUSD(data.expensesUSD)}</p>}
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
          <p className="text-[10px] text-stone-500 dark:text-stone-400 mb-0.5">Ingresos</p>
          <p className="text-xs font-semibold text-green-700 dark:text-green-400">{formatARS(data.incomeARS)}</p>
          {data.incomeUSD > 0 && <p className="text-[10px] text-green-400 mt-0.5">{formatUSD(data.incomeUSD)}</p>}
        </div>
      </div>
    </div>
  );
}

function EmptyMonthCard({ month, isMobile }: { month: number; isMobile: boolean }) {
  const label = isMobile ? MONTH_NAMES[month - 1] : MONTH_NAMES_FULL[month - 1];
  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4 opacity-40">
      <p className="text-sm font-semibold text-stone-500 dark:text-stone-400 mb-3">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-stone-100 dark:bg-stone-800 rounded-lg p-2">
          <p className="text-[10px] text-stone-400 mb-0.5">Gastos</p>
          <p className="text-xs font-semibold text-stone-400">{formatARS(0)}</p>
        </div>
        <div className="bg-stone-100 dark:bg-stone-800 rounded-lg p-2">
          <p className="text-[10px] text-stone-400 mb-0.5">Ingresos</p>
          <p className="text-xs font-semibold text-stone-400">{formatARS(0)}</p>
        </div>
      </div>
    </div>
  );
}

function YearTotalsCard({ data }: { data: YearlySummary }) {
  const netARS = data.incomeARS - data.expensesARS;
  const netUSD = data.incomeUSD - data.expensesUSD;
  const positive = netARS >= 0;
  return (
    <div className="bg-stone-900 dark:bg-stone-800 rounded-xl p-5 mb-6">
      <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-4">Total {data.year}</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="min-w-0">
          <p className="text-xs text-stone-400 mb-1">Gastos</p>
          <p className="text-base sm:text-xl font-bold text-red-400 truncate">{formatARS(data.expensesARS)}</p>
          {data.expensesUSD > 0 && <p className="text-xs text-red-400/70 mt-0.5 truncate">{formatUSD(data.expensesUSD)}</p>}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-stone-400 mb-1">Ingresos</p>
          <p className="text-base sm:text-xl font-bold text-green-400 truncate">{formatARS(data.incomeARS)}</p>
          {data.incomeUSD > 0 && <p className="text-xs text-green-400/70 mt-0.5 truncate">{formatUSD(data.incomeUSD)}</p>}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-stone-400 mb-1">Balance</p>
          <p className={`text-base sm:text-xl font-bold truncate ${positive ? 'text-green-400' : 'text-red-400'}`}>
            {positive ? '+' : ''}{formatARS(netARS)}
          </p>
          {netUSD !== 0 && (
            <p className={`text-xs mt-0.5 truncate ${positive ? 'text-green-400/70' : 'text-red-400/70'}`}>
              {positive ? '+' : ''}{formatUSD(netUSD)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const isMobile = useIsMobile();
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    historyService.getSummary()
      .then(data => {
        setSummary(data);
        if (data.years.length > 0) setSelectedYear(data.years[0].year);
        setError(null);
      })
      .catch(() => setError('Error al cargar el historial.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900 dark:border-stone-100" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className={isMobile ? 'px-4 pt-6' : 'max-w-4xl mx-auto px-6 py-8'}>
        <p className="text-red-600 dark:text-red-400">{error || 'Sin datos'}</p>
      </div>
    );
  }

  const yearList = summary.years.map(y => y.year);
  const currentYearData: YearlySummary | undefined = summary.years.find(y => y.year === selectedYear);

  // Build full 12-month grid, fill gaps with empty
  const monthsMap = new Map<number, MonthlySummary>();
  (currentYearData?.months ?? []).forEach(m => monthsMap.set(m.month, m));
  const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);

  // ── MOBILE ────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="animate-fade-in pb-6">
        <div className="px-4 pt-5 pb-4">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <History size={22} className="text-teal-700 dark:text-teal-400" />Histórico
          </h1>
        </div>

        {/* Year selector */}
        <div className="flex justify-center mb-4">
          {yearList.length > 0 && selectedYear !== null ? (
            <YearSelector years={yearList} selected={selectedYear} onChange={setSelectedYear} />
          ) : (
            <p className="text-stone-400 text-sm">Sin datos</p>
          )}
        </div>

        {currentYearData ? (
          <>
            {/* Year totals */}
            <div className="mx-4 mb-4">
              <YearTotalsCard data={currentYearData} />
            </div>

            {/* Month grid */}
            <div className="px-4 grid grid-cols-2 gap-3">
              {allMonths.map(m => {
                const data = monthsMap.get(m);
                return data
                  ? <MonthCard key={m} data={data} isMobile />
                  : <EmptyMonthCard key={m} month={m} isMobile />;
              })}
            </div>
          </>
        ) : (
          <p className="text-center text-stone-400 dark:text-stone-500 py-12 text-sm">Sin datos para este año</p>
        )}
      </div>
    );
  }

  // ── DESKTOP ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-6 animate-fade-in flex items-center justify-between">
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-3">
            <History size={36} className="text-teal-700 dark:text-teal-400" />Histórico
          </h1>
          {yearList.length > 0 && selectedYear !== null && (
            <YearSelector years={yearList} selected={selectedYear} onChange={setSelectedYear} />
          )}
        </div>

        {yearList.length === 0 ? (
          <div className="card animate-fade-in">
            <p className="text-center text-stone-400 dark:text-stone-500 py-12">Sin datos históricos</p>
          </div>
        ) : currentYearData ? (
          <>
            <div className="animate-fade-in">
              <YearTotalsCard data={currentYearData} />
            </div>

            <div className="grid grid-cols-3 gap-4 animate-fade-in">
              {allMonths.map(m => {
                const data = monthsMap.get(m);
                return data
                  ? <MonthCard key={m} data={data} isMobile={false} />
                  : <EmptyMonthCard key={m} month={m} isMobile={false} />;
              })}
            </div>
          </>
        ) : (
          <p className="text-center text-stone-400 dark:text-stone-500 py-12">Sin datos para este año</p>
        )}
      </div>
    </div>
  );
}
