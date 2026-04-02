import { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { budgetService } from '../services/api';
import Modal from '../components/Modal.tsx';
import BudgetForm from '../components/BudgetForm.tsx';
import CategoryDonutChart, { DonutSlice } from '../components/CategoryDonutChart.tsx';
import { Budget } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const formatARS = (amount?: number) =>
  amount != null
    ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount)
    : '—';

const formatUSD = (amount?: number) =>
  amount != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount)
    : '—';

const isPesosCurrency = (currency?: { name?: string }) => {
  if (!currency?.name) return true;
  const n = currency.name.toLowerCase();
  return n.includes('peso') || n.includes('ars') || n.includes('argentino');
};

// ── BudgetCard ───────────────────────────────────────────────────────────────

function BudgetCard({
  budget,
  onEdit,
  onDelete,
}: {
  budget: Budget;
  onEdit: (b: Budget) => void;
  onDelete: (b: Budget) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();

  const total = (budget.cancelledCount ?? 0) + (budget.pendingCount ?? 0);

  const budgetSlices: DonutSlice[] = (() => {
    const map = new Map<string, { ars: number; usd: number; icon?: string }>();
    (budget.recurrentExpenses || []).forEach(re => {
      const key = re.category?.name || 'Sin categoría';
      const icon = re.category?.icon || undefined;
      const ars = re.amountInPesos || 0;
      const usd = re.amountInDollars || 0;
      const existing = map.get(key);
      if (existing) {
        existing.ars += ars;
        existing.usd += usd;
      } else {
        map.set(key, { ars, usd, icon });
      }
    });
    return Array.from(map.entries()).map(([label, { ars, usd, icon }]) => ({
      label, valueARS: ars, valueUSD: usd, icon,
    }));
  })();
  const cancelled = budget.cancelledCount ?? 0;
  const progressPct = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  return (
    <div className="card animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-stone-600 dark:text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50 leading-tight">
              {budget.description}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              budget.enabled
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                : 'bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500'
            }`}>
              {budget.enabled ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(budget)}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Editar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(budget)}
            className="p-2 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Eliminar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Totals grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-stone-50 dark:bg-stone-800/60 rounded-xl p-3">
          <p className="text-xs text-stone-400 dark:text-stone-500 mb-1">Esperado</p>
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">
            {formatARS(budget.totalExpectedARS)}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
            {formatUSD(budget.totalExpectedUSD)}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
          <p className="text-xs text-green-600 dark:text-green-400 mb-1">Pagado</p>
          <p className="text-sm font-semibold text-green-700 dark:text-green-300">
            {formatARS(budget.totalCancelledARS)}
          </p>
          <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">
            {formatUSD(budget.totalCancelledUSD)}
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Pendiente</p>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            {formatARS((budget.totalExpectedARS ?? 0) - (budget.totalCancelledARS ?? 0))}
          </p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
            {formatUSD((budget.totalExpectedUSD ?? 0) - (budget.totalCancelledUSD ?? 0))}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {cancelled} de {total} pagados
            </span>
            <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
              {progressPct}%
            </span>
          </div>
          <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Category chart */}
      {budgetSlices.length > 0 && (
        <div className="mt-1 mb-2">
          <CategoryDonutChart
            slices={budgetSlices}
            totalARS={budget.totalExpectedARS ?? 0}
            totalUSD={budget.totalExpectedUSD ?? 0}
            emptyMessage="Sin gastos asignados"
            layout={isMobile ? 'vertical' : 'horizontal'}
          />
        </div>
      )}

      {/* Accordion toggle */}
      {budget.recurrentExpenses && budget.recurrentExpenses.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors w-full text-left"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {expanded ? 'Ocultar' : 'Ver'} gastos recurrentes ({budget.recurrentExpenses.length})
          </button>

          {expanded && (
            <div className="mt-3 border border-stone-100 dark:border-stone-800 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-800 animate-fade-in">
              {budget.recurrentExpenses.map(re => (
                <div key={re.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
                      {re.description}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">
                      Vence el día {re.dayOfMonth}
                      {re.category?.name && ` · ${re.category.name}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 leading-tight">
                      {isPesosCurrency(re.currency) ? formatARS(re.amountInPesos) : formatUSD(re.amountInDollars)}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 leading-tight">
                      {isPesosCurrency(re.currency)
                        ? (re.amountInDollars != null ? formatUSD(re.amountInDollars) : '')
                        : formatARS(re.amountInPesos)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── BudgetList (page) ────────────────────────────────────────────────────────

export default function BudgetList() {
  const isMobile = useIsMobile();
  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [creatingNextMonth, setCreatingNextMonth] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, [selectedMonth, selectedYear]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const res = await budgetService.getAll(
        { month: selectedMonth, year: selectedYear },
        0,
        100,
      );
      setBudgets(res.content);
      setError(null);
    } catch (err) {
      setError('Error al cargar los presupuestos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  };

  const isCurrentMonth =
    selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();

  const handleCreate = () => {
    setSelectedBudget(null);
    setIsModalOpen(true);
  };

  const handleCreateNextMonth = async () => {
    try {
      setCreatingNextMonth(true);
      const created = await budgetService.createNextMonth();
      setSelectedMonth(created.month);
      setSelectedYear(created.year);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        alert('No hay un presupuesto previo para copiar. Creá el primero manualmente.');
      } else {
        alert('Error al crear el presupuesto del próximo mes.');
      }
    } finally {
      setCreatingNextMonth(false);
    }
  };

  const handleEdit = (b: Budget) => {
    setSelectedBudget(b);
    setIsModalOpen(true);
  };

  const handleDelete = (b: Budget) => {
    setBudgetToDelete(b);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!budgetToDelete?.id) return;
    try {
      await budgetService.delete(budgetToDelete.id);
      loadBudgets();
      setIsDeleteModalOpen(false);
      setBudgetToDelete(null);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el presupuesto');
    }
  };

  const handleSubmit = async (formData: Budget) => {
    try {
      if (selectedBudget?.id) {
        await budgetService.update(selectedBudget.id, formData);
        if (formData.enabled !== selectedBudget.enabled) {
          if (formData.enabled) {
            await budgetService.enable(selectedBudget.id);
          } else {
            await budgetService.disable(selectedBudget.id);
          }
        }
      } else {
        await budgetService.create(formData);
      }
      loadBudgets();
      setIsModalOpen(false);
      setSelectedBudget(null);
    } catch (err) {
      console.error(err);
      alert('Error al guardar el presupuesto');
    }
  };

  // ── Month navigator ──────────────────────────────────────────────────────

  const MonthNavigator = () => (
    <div className="flex items-center gap-4">
      <button
        onClick={prevMonth}
        className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-600 dark:text-stone-400"
        aria-label="Mes anterior"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToCurrentMonth}
        disabled={isCurrentMonth}
        className="text-center min-w-[9rem] disabled:cursor-default"
        title={isCurrentMonth ? 'Mes actual' : 'Ir al mes actual'}
      >
        <p className="text-xl font-bold text-stone-900 dark:text-stone-50 leading-tight">
          {MONTH_NAMES[selectedMonth - 1]}
        </p>
        <p className="text-sm text-stone-400 dark:text-stone-500">{selectedYear}</p>
      </button>

      <button
        onClick={nextMonth}
        className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-600 dark:text-stone-400"
        aria-label="Mes siguiente"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );

  // ── Modals ───────────────────────────────────────────────────────────────

  const modals = (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
      >
        <BudgetForm
          budget={selectedBudget}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <p className="text-stone-600 dark:text-stone-400">
            ¿Estás seguro de que deseas eliminar{' '}
            <span className="font-semibold">{budgetToDelete?.description}</span>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 pt-2">
            <button onClick={confirmDelete} className="btn btn-danger flex-1">Eliminar</button>
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancelar</button>
          </div>
        </div>
      </Modal>
    </>
  );

  // ── MOBILE VIEW ──────────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <div className="animate-fade-in pb-6">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2"><Target size={22} className="text-teal-700 dark:text-teal-400" />Presupuesto</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNextMonth}
              disabled={creatingNextMonth}
              className="w-9 h-9 bg-stone-200 dark:bg-stone-700 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform disabled:opacity-50"
              title="Crear presupuesto del próximo mes"
            >
              {creatingNextMonth ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-stone-700 dark:border-stone-300" />
              ) : (
                <svg className="w-4 h-4 text-stone-700 dark:text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            <button
              onClick={handleCreate}
              className="w-9 h-9 bg-stone-900 dark:bg-stone-100 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5 text-white dark:text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Month navigator */}
        <div className="flex justify-center py-2 px-4">
          <MonthNavigator />
        </div>

        {error && (
          <div className="mx-4 mb-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900 dark:border-stone-100" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              Sin presupuestos en {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </p>
            <div className="flex flex-col items-center gap-2 mt-4">
              <button onClick={handleCreate} className="btn btn-primary text-sm">
                Crear presupuesto
              </button>
              <button
                onClick={handleCreateNextMonth}
                disabled={creatingNextMonth}
                className="btn btn-secondary text-sm disabled:opacity-60"
              >
                {creatingNextMonth ? 'Creando...' : 'Copiar del mes anterior'}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 space-y-4 mt-2">
            {budgets.map(b => (
              <BudgetCard key={b.id} budget={b} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {modals}
      </div>
    );
  }

  // ── DESKTOP VIEW ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2 flex items-center gap-3"><Target size={36} className="text-teal-700 dark:text-teal-400" />Presupuesto</h1>
          <p className="text-stone-600 dark:text-stone-400">Planificá tus gastos fijos mensuales</p>
        </div>

        {/* Controls bar */}
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <MonthNavigator />
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateNextMonth}
              disabled={creatingNextMonth}
              className="btn btn-secondary disabled:opacity-60"
              title="Crea un presupuesto para el mes siguiente basado en el último registrado"
            >
              {creatingNextMonth ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  Creando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Próximo mes
                </span>
              )}
            </button>
            <button onClick={handleCreate} className="btn btn-primary">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Presupuesto
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-6 animate-fade-in">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 dark:border-stone-100" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="card animate-fade-in text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Sin presupuesto para {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </h3>
            <p className="text-stone-400 dark:text-stone-500 text-sm mb-6">
              Creá un presupuesto para planificar los gastos de este mes
            </p>
            <div className="flex items-center gap-3 justify-center">
              <button onClick={handleCreate} className="btn btn-primary">
                Crear presupuesto
              </button>
              <button
                onClick={handleCreateNextMonth}
                disabled={creatingNextMonth}
                className="btn btn-secondary disabled:opacity-60"
              >
                {creatingNextMonth ? 'Creando...' : 'Copiar del mes anterior'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {budgets.map(b => (
              <BudgetCard key={b.id} budget={b} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {modals}
    </div>
  );
}
