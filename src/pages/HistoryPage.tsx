import { useState, useEffect } from 'react';
import { historyService } from '../services/api';
import { HistorySummary, YearlySummary } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

const formatARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const formatUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

function NetBadge({ ars, usd }: { ars: number; usd: number }) {
  const netARS = ars;
  const netUSD = usd;
  const positive = netARS >= 0;
  return (
    <div className={`flex items-center gap-2 text-sm font-semibold ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
      <span>{positive ? '▲' : '▼'}</span>
      <span>{formatARS(Math.abs(netARS))}</span>
      {netUSD !== 0 && <span className="text-xs font-normal text-stone-400">/ {formatUSD(Math.abs(netUSD))}</span>}
    </div>
  );
}

function YearCard({ data }: { data: YearlySummary }) {
  const netARS = data.incomeARS - data.expensesARS;
  const netUSD = data.incomeUSD - data.expensesUSD;

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">{data.year}</h3>
        <NetBadge ars={netARS} usd={netUSD} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Gastos</p>
          <p className="font-semibold text-red-700 dark:text-red-400 text-sm">{formatARS(data.expensesARS)}</p>
          {data.expensesUSD > 0 && (
            <p className="text-xs text-red-400 dark:text-red-500 mt-0.5">{formatUSD(data.expensesUSD)}</p>
          )}
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Ingresos</p>
          <p className="font-semibold text-green-700 dark:text-green-400 text-sm">{formatARS(data.incomeARS)}</p>
          {data.incomeUSD > 0 && (
            <p className="text-xs text-green-400 dark:text-green-500 mt-0.5">{formatUSD(data.incomeUSD)}</p>
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

  useEffect(() => {
    historyService.getSummary()
      .then(data => { setSummary(data); setError(null); })
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

  const allTimeNetARS = summary.allTimeIncomeARS - summary.allTimeExpensesARS;
  const allTimeNetUSD = summary.allTimeIncomeUSD - summary.allTimeExpensesUSD;

  // ── MOBILE ────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="animate-fade-in pb-6">
        <div className="px-4 pt-5 pb-4">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Histórico</h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{summary.years.length} años registrados</p>
        </div>

        {/* All time card */}
        <div className="mx-4 mb-4 bg-stone-900 dark:bg-stone-100 rounded-xl p-4">
          <p className="text-xs text-stone-400 dark:text-stone-500 mb-2 font-medium uppercase tracking-wide">Total histórico</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] text-stone-400 dark:text-stone-500">Gastos</p>
              <p className="font-semibold text-red-400 dark:text-red-500 text-sm">{formatARS(summary.allTimeExpensesARS)}</p>
              {summary.allTimeExpensesUSD > 0 && <p className="text-xs text-red-400/70 dark:text-red-500/70">{formatUSD(summary.allTimeExpensesUSD)}</p>}
            </div>
            <div>
              <p className="text-[11px] text-stone-400 dark:text-stone-500">Ingresos</p>
              <p className="font-semibold text-green-400 dark:text-green-500 text-sm">{formatARS(summary.allTimeIncomeARS)}</p>
              {summary.allTimeIncomeUSD > 0 && <p className="text-xs text-green-400/70 dark:text-green-500/70">{formatUSD(summary.allTimeIncomeUSD)}</p>}
            </div>
            <div>
              <p className="text-[11px] text-stone-400 dark:text-stone-500">Balance neto</p>
              <p className={`font-semibold text-sm ${allTimeNetARS >= 0 ? 'text-green-400 dark:text-green-500' : 'text-red-400 dark:text-red-500'}`}>
                {allTimeNetARS >= 0 ? '+' : ''}{formatARS(allTimeNetARS)}
              </p>
              {allTimeNetUSD !== 0 && (
                <p className={`text-xs ${allTimeNetUSD >= 0 ? 'text-green-400/80 dark:text-green-500/80' : 'text-red-400/80 dark:text-red-500/80'}`}>
                  {allTimeNetUSD >= 0 ? '+' : ''}{formatUSD(allTimeNetUSD)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Year cards */}
        <div className="px-4 space-y-3">
          {summary.years.length === 0 ? (
            <p className="text-center text-stone-400 dark:text-stone-500 py-12 text-sm">Sin datos históricos</p>
          ) : (
            summary.years.map(y => <YearCard key={y.year} data={y} />)
          )}
        </div>
      </div>
    );
  }

  // ── DESKTOP ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2">Histórico</h1>
          <p className="text-stone-600 dark:text-stone-400">Resumen de ingresos y gastos por año</p>
        </div>

        {/* All time summary */}
        <div className="bg-stone-900 dark:bg-stone-800 rounded-2xl p-6 mb-8 animate-fade-in">
          <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-4">Total histórico</p>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-stone-400 mb-1">Gastos totales</p>
              <p className="text-2xl font-bold text-red-400">{formatARS(summary.allTimeExpensesARS)}</p>
              {summary.allTimeExpensesUSD > 0 && <p className="text-sm text-red-400/70 mt-0.5">{formatUSD(summary.allTimeExpensesUSD)}</p>}
            </div>
            <div>
              <p className="text-sm text-stone-400 mb-1">Ingresos totales</p>
              <p className="text-2xl font-bold text-green-400">{formatARS(summary.allTimeIncomeARS)}</p>
              {summary.allTimeIncomeUSD > 0 && <p className="text-sm text-green-400/70 mt-0.5">{formatUSD(summary.allTimeIncomeUSD)}</p>}
            </div>
            <div>
              <p className="text-sm text-stone-400 mb-1">Balance neto</p>
              <p className={`text-2xl font-bold ${allTimeNetARS >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {allTimeNetARS >= 0 ? '+' : ''}{formatARS(allTimeNetARS)}
              </p>
              {allTimeNetUSD !== 0 && (
                <p className={`text-sm mt-0.5 ${allTimeNetUSD >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
                  {allTimeNetUSD >= 0 ? '+' : ''}{formatUSD(allTimeNetUSD)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Year grid */}
        {summary.years.length === 0 ? (
          <div className="card animate-fade-in">
            <p className="text-center text-stone-400 dark:text-stone-500 py-12">Sin datos históricos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {summary.years.map(y => <YearCard key={y.year} data={y} />)}
          </div>
        )}
      </div>
    </div>
  );
}
