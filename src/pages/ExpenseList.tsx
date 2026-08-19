import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { expenseService, merchantShortcutService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import ExpenseForm from '../components/ExpenseForm.tsx';
import CategoryDonutChart, { DonutSlice } from '../components/CategoryDonutChart.tsx';
import MonthPicker, { monthBounds } from '../components/MonthPicker.tsx';
import CategoryIcon, { isCustomImageIcon } from '../components/CategoryIcon';
import { Currency, Expense, MerchantShortcut, TableColumn } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount);

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);

const formatDate = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const isForeignCurrency = (currency?: Currency | null): boolean => {
  if (!currency?.name) return false;
  const name = currency.name.toLowerCase();
  return !(name.includes('peso') || name.includes('ars') || name.includes('argentino'));
};

const PAYMENT_METHOD_TYPE_LABELS: Record<string, string> = {
  QR: 'QR',
  TRANSFER: 'Transferencia',
  CASH: 'Efectivo',
  DEBIT_CARD: 'Débito',
  CREDIT_CARD: 'Crédito',
};

const BG_COLORS = [
  'bg-red-400', 'bg-orange-400', 'bg-amber-500', 'bg-lime-500',
  'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500',
  'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500',
  'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-400',
];
const catBg = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return BG_COLORS[h % BG_COLORS.length];
};

export default function ExpenseList() {
  const isMobile = useIsMobile();
  const location = useLocation();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [merchantShortcuts, setMerchantShortcuts] = useState<MerchantShortcut[]>([]);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [chartCurrency, setChartCurrency] = useState<'ARS' | 'USD'>('ARS');

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  // Open create modal when navigated here with ?new=1
  useEffect(() => {
    if (new URLSearchParams(location.search).get('new') === '1') {
      setSelectedExpense(null);
      setIsModalOpen(true);
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search]);

  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setCurrentPage(0);
  };

  useEffect(() => {
    loadExpenses();
  }, [currentPage, selectedYear, selectedMonth]);

  useEffect(() => {
    merchantShortcutService.getAll({ enabled: true }, 0, 100)
      .then(response => setMerchantShortcuts(response.content))
      .catch(() => setMerchantShortcuts([]));
  }, []);

  const findShortcutIcon = (expense: Expense): string | undefined => {
    const match = merchantShortcuts.find(
      s => s.name === expense.description && s.category?.id === expense.category?.id
    );
    return match?.icon;
  };

  const loadExpenses = async (): Promise<void> => {
    try {
      setLoading(true);
      const { startDate, endDate } = monthBounds(selectedYear, selectedMonth);
      const response = await expenseService.getAll({ startDate, endDate }, currentPage, 20);
      setExpenses(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err) {
      setError('Error al cargar los gastos. Verifica que el backend esté corriendo.');
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (): void => {
    setSelectedExpense(null);
    setIsModalOpen(true);
  };

  const handleDelete = (expense: Expense): void => {
    setExpenseToDelete(expense);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!expenseToDelete?.id) return;
    try {
      await expenseService.delete(expenseToDelete.id);
      loadExpenses();
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert('Error al eliminar el gasto');
    }
  };

  const handleSubmit = async (formData: Expense): Promise<void> => {
    try {
      if (selectedExpense?.id) {
        await expenseService.update(selectedExpense.id, formData);
      } else {
        await expenseService.create(formData);
      }
      loadExpenses();
      setIsModalOpen(false);
      setSelectedExpense(null);
    } catch (err) {
      console.error('Error saving expense:', err);
      alert('Error al guardar el gasto');
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amountInPesos, 0);
  const totalExpensesUSD = expenses.reduce((sum, exp) => sum + (exp.amountInDollars || 0), 0);
  const microExpenses = expenses.filter(exp => exp.microExpense);
  const microTotal = microExpenses.reduce((sum, exp) => sum + exp.amountInPesos, 0);
  const microTotalUSD = microExpenses.reduce((sum, exp) => sum + (exp.amountInDollars || 0), 0);

  const expenseSlices: DonutSlice[] = (() => {
    const map = new Map<string, { ars: number; usd: number; icon?: string }>();
    expenses.forEach(exp => {
      const key = exp.category?.name || 'Sin categoría';
      const existing = map.get(key);
      if (existing) {
        existing.ars += exp.amountInPesos;
        existing.usd += exp.amountInDollars || 0;
      } else {
        map.set(key, { ars: exp.amountInPesos, usd: exp.amountInDollars || 0, icon: exp.category?.icon });
      }
    });
    return Array.from(map.entries()).map(([label, { ars, usd, icon }]) => ({ label, valueARS: ars, valueUSD: usd, icon }));
  })();

  const modals = (
    <>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedExpense ? 'Editar Gasto' : 'Registrar Gasto'}>
        <ExpenseForm expense={selectedExpense} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} />
      </Modal>
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Eliminación">
        <div className="space-y-4">
          <p className="text-stone-600 dark:text-stone-400">
            ¿Estás seguro de que deseas eliminar el gasto{' '}
            <span className="font-semibold">{expenseToDelete?.description || expenseToDelete?.category?.name}</span>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 pt-4">
            <button onClick={confirmDelete} className="btn btn-danger flex-1">Eliminar</button>
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancelar</button>
          </div>
        </div>
      </Modal>
    </>
  );

  const pagination = totalPages > 1 && (
    <div className="flex items-center justify-center gap-3 py-4">
      <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
              className="btn btn-secondary disabled:opacity-50 py-1.5 px-4 text-sm">Anterior</button>
      <span className="text-sm text-stone-500 dark:text-stone-400">{currentPage + 1} / {totalPages}</span>
      <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}
              className="btn btn-secondary disabled:opacity-50 py-1.5 px-4 text-sm">Siguiente</button>
    </div>
  );

  // ── MOBILE VIEW ────────────────────────────────────────────────────────────
  if (isMobile) {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900 dark:border-stone-100" />
        </div>
      );
    }

    return (
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-2">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2"><Receipt size={22} className="text-teal-700 dark:text-teal-400" />Gastos</h1>
          <button
            onClick={handleCreate}
            className="w-9 h-9 bg-teal-700 dark:bg-teal-600 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-center pb-3">
          <MonthPicker year={selectedYear} month={selectedMonth} onChange={handleMonthChange} />
        </div>


        {/* Category chart */}
        <div className="mx-4 mb-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 px-4">
          <CategoryDonutChart
            slices={expenseSlices}
            totalARS={totalExpenses}
            totalUSD={totalExpensesUSD}
            emptyMessage="Sin gastos"
            currency={chartCurrency}
            onCurrencyChange={setChartCurrency}
          />
          <div className="border-t border-stone-100 dark:border-stone-800 -mx-4 py-3 px-4 flex items-center justify-center gap-4">
            <p className="text-xs text-stone-400 dark:text-stone-500">Gastos hormiga</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">ARS</span>
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">{formatCurrency(microTotal)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">USD</span>
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">{formatUSD(microTotalUSD)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-4 mb-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* List */}
        <div className="px-4 space-y-2.5">
          {expenses.length === 0 ? (
            <p className="text-center text-stone-400 dark:text-stone-500 py-12 text-sm">Sin gastos registrados</p>
          ) : (
            expenses.map(expense => (
              <div
                key={expense.id}
                className="w-full flex items-start gap-3 p-3.5 bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 text-left"
              >
                {/* Shortcut icon (falls back to category icon) */}
                {(() => {
                  const iconValue = findShortcutIcon(expense) || expense.category?.icon;
                  if (iconValue && isCustomImageIcon(iconValue)) {
                    return (
                      <div className="w-11 h-11 rounded-2xl flex-shrink-0 overflow-hidden">
                        <img src={iconValue} alt="" className="w-full h-full object-cover" />
                      </div>
                    );
                  }
                  return (
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${catBg(expense.category?.name || '')}`}>
                      {iconValue ? (
                        <CategoryIcon icon={iconValue} size={20} className="text-white" />
                      ) : (
                        <span className="text-sm font-bold text-white leading-none">
                          {(expense.category?.name || '?')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-stone-900 dark:text-stone-50 truncate text-[15px]">{expense.description || expense.category.name}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${chartCurrency === 'ARS' ? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                        {chartCurrency}
                      </span>
                      <p className="font-bold text-stone-900 dark:text-stone-50 leading-tight">
                        {chartCurrency === 'ARS' ? formatCurrency(expense.amountInPesos) : formatUSD(expense.amountInDollars || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <div className="flex items-center gap-1.5 min-w-0 text-xs text-stone-400 dark:text-stone-500">
                      {expense.paymentMethod?.paymentMethodType && (
                        <>
                          {expense.paymentMethod.issuingEntity?.icon && (
                            <img src={expense.paymentMethod.issuingEntity.icon} alt="" className="w-3.5 h-3.5 rounded object-cover flex-shrink-0" />
                          )}
                          <span className="flex-shrink-0">
                            {PAYMENT_METHOD_TYPE_LABELS[expense.paymentMethod.paymentMethodType] || expense.paymentMethod.paymentMethodType}
                          </span>
                          <span className="flex-shrink-0">·</span>
                        </>
                      )}
                      <span className="truncate">{formatDate(expense.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isForeignCurrency(expense.currency) && (
                        <span className="text-xs text-stone-400 dark:text-stone-500 leading-tight">
                          {chartCurrency === 'ARS'
                            ? (expense.amountInDollars != null ? formatUSD(expense.amountInDollars) : '')
                            : formatCurrency(expense.amountInPesos)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(expense)}
                        className="p-1.5 -m-1.5 text-stone-300 hover:text-red-500 dark:text-stone-600 dark:hover:text-red-400 transition-colors rounded-lg flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {pagination}
        {modals}
      </div>
    );
  }

  // ── DESKTOP VIEW ───────────────────────────────────────────────────────────
  const columns: TableColumn<Expense>[] = [
    { key: 'date', label: 'Fecha', render: (value: string) => formatDate(value) },
    {
      key: 'description', label: 'Descripción',
      render: (value: string, row: Expense) => <span className="font-medium text-stone-900 dark:text-stone-50">{value || row.category.name}</span>,
    },
    {
      key: 'amountInPesos', label: 'Monto',
      render: (value: number, row: Expense) => (
        <div className="flex flex-col leading-tight gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${chartCurrency === 'ARS' ? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
              {chartCurrency}
            </span>
            <span className="font-semibold text-stone-900 dark:text-stone-50">
              {chartCurrency === 'ARS' ? formatCurrency(value) : formatUSD(row.amountInDollars || 0)}
            </span>
          </div>
          <span className="text-xs text-stone-400 dark:text-stone-500">
            {chartCurrency === 'ARS' ? (row.amountInDollars ? formatUSD(row.amountInDollars) : '') : formatCurrency(value)}
          </span>
        </div>
      ),
    },
    {
      key: 'category', label: 'Categoría',
      render: (value: any) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {value?.name || 'Sin categoría'}
        </span>
      ),
    },
    {
      key: 'paymentMethod', label: 'Método de Pago',
      render: (value: any) => (
        <div className="flex items-center gap-1.5">
          {value?.issuingEntity?.icon && (
            <img src={value.issuingEntity.icon} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
          )}
          <span className="text-sm text-stone-600 dark:text-stone-400">{value?.name || 'N/A'}</span>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 dark:border-stone-100" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2 flex items-center gap-3">
              <Receipt size={36} className="text-teal-700 dark:text-teal-400" />
              Gastos
            </h1>
            <p className="text-stone-600 dark:text-stone-400">Registra y administra tus gastos diarios</p>
          </div>
          <MonthPicker year={selectedYear} month={selectedMonth} onChange={handleMonthChange} />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-6 animate-fade-in">
            {error}
          </div>
        )}


        <div className="card animate-fade-in mb-6">
          <CategoryDonutChart
            slices={expenseSlices}
            totalARS={totalExpenses}
            totalUSD={totalExpensesUSD}
            emptyMessage="Sin gastos"
            currency={chartCurrency}
            onCurrencyChange={setChartCurrency}
            layout="horizontal"
          />
          <div className="border-t border-stone-100 dark:border-stone-800 mt-2 -mx-6 -mb-6 py-3 px-6 flex items-center gap-4">
            <p className="text-xs text-stone-400 dark:text-stone-500">Gastos hormiga</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">ARS</span>
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">{formatCurrency(microTotal)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">USD</span>
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">{formatUSD(microTotalUSD)}</span>
            </div>
          </div>
        </div>


        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            Mostrando <span className="font-semibold text-stone-900 dark:text-stone-50">{expenses.length}</span> de{' '}
            <span className="font-semibold">{totalElements}</span> gastos
            {totalPages > 1 && <span> - Página {currentPage + 1} de {totalPages}</span>}
          </div>
          <button onClick={handleCreate} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Registrar Gasto
            </span>
          </button>
        </div>

        <div className="card animate-fade-in">
          <Table columns={columns} data={expenses} onDelete={handleDelete} />
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
                    className="btn btn-secondary disabled:opacity-50">Anterior</button>
            <span className="text-sm text-stone-600 dark:text-stone-400">Página {currentPage + 1} de {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}
                    className="btn btn-secondary disabled:opacity-50">Siguiente</button>
          </div>
        )}

        {modals}
      </div>
    </div>
  );
}
