import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { incomeService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import IncomeForm from '../components/IncomeForm.tsx';
import CategoryDonutChart, { DonutSlice } from '../components/CategoryDonutChart.tsx';
import MonthPicker, { monthBounds } from '../components/MonthPicker.tsx';
import { Income, TableColumn } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount);

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);

const formatDate = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

export default function IncomeList() {
  const isMobile = useIsMobile();
  const location = useLocation();

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [chartCurrency, setChartCurrency] = useState<'ARS' | 'USD'>('ARS');

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setCurrentPage(0);
  };

  useEffect(() => {
    if (new URLSearchParams(location.search).get('new') === '1') {
      setSelectedIncome(null);
      setIsModalOpen(true);
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search]);

  useEffect(() => {
    loadIncomes();
  }, [currentPage, selectedYear, selectedMonth]);

  const loadIncomes = async (): Promise<void> => {
    try {
      setLoading(true);
      const { startDate, endDate } = monthBounds(selectedYear, selectedMonth);
      const response = await incomeService.getAll({ startDate, endDate }, currentPage, 20);
      setIncomes(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err) {
      setError('Error al cargar los ingresos. Verifica que el backend esté corriendo.');
      console.error('Error loading incomes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (): void => { setSelectedIncome(null); setIsModalOpen(true); };
  const handleEdit = (income: Income): void => { setSelectedIncome(income); setIsModalOpen(true); };
  const handleDelete = (income: Income): void => { setIncomeToDelete(income); setIsDeleteModalOpen(true); };

  const confirmDelete = async (): Promise<void> => {
    if (!incomeToDelete?.id) return;
    try {
      await incomeService.delete(incomeToDelete.id);
      loadIncomes();
      setIsDeleteModalOpen(false);
      setIncomeToDelete(null);
    } catch (err) {
      console.error('Error deleting income:', err);
      alert('Error al eliminar el ingreso');
    }
  };

  const handleSubmit = async (formData: Income): Promise<void> => {
    try {
      if (selectedIncome?.id) {
        await incomeService.update(selectedIncome.id, formData);
      } else {
        await incomeService.create(formData);
      }
      loadIncomes();
      setIsModalOpen(false);
      setSelectedIncome(null);
    } catch (err) {
      console.error('Error saving income:', err);
      alert('Error al guardar el ingreso');
    }
  };

  const totalARS = incomes.reduce((sum, inc) => sum + inc.amountInPesos, 0);
  const totalUSD = incomes.reduce((sum, inc) => sum + (inc.amountInDollars || 0), 0);

  const incomeSlices: DonutSlice[] = (() => {
    const map = new Map<string, { ars: number; usd: number; icon?: string }>();
    incomes.forEach(inc => {
      const key = inc.source?.name || 'Sin fuente';
      const existing = map.get(key);
      if (existing) {
        existing.ars += inc.amountInPesos;
        existing.usd += inc.amountInDollars || 0;
      } else {
        map.set(key, { ars: inc.amountInPesos, usd: inc.amountInDollars || 0, icon: inc.source?.icon });
      }
    });
    return Array.from(map.entries()).map(([label, { ars, usd, icon }]) => ({ label, valueARS: ars, valueUSD: usd, icon }));
  })();

  const modals = (
    <>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedIncome ? 'Editar Ingreso' : 'Registrar Ingreso'}>
        <IncomeForm income={selectedIncome} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} />
      </Modal>
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Eliminación">
        <div className="space-y-4">
          <p className="text-stone-600 dark:text-stone-400">
            ¿Estás seguro de que deseas eliminar el ingreso{' '}
            <span className="font-semibold">{incomeToDelete?.description}</span>?
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
        <div className="flex items-center justify-between px-4 pt-5 pb-2">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2"><TrendingUp size={22} className="text-teal-700 dark:text-teal-400" />Ingresos</h1>
          <button
            onClick={handleCreate}
            className="w-9 h-9 bg-stone-900 dark:bg-stone-100 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-white dark:text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-center pb-3">
          <MonthPicker year={selectedYear} month={selectedMonth} onChange={handleMonthChange} />
        </div>

        <div className="mx-4 mb-3 bg-white dark:bg-stone-900 rounded-xl px-4 py-3 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400">Total ARS</p>
            <p className="font-bold text-stone-900 dark:text-stone-50">{formatCurrency(totalARS)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-500 dark:text-stone-400">Total USD</p>
            <p className="font-semibold text-blue-600">{formatUSD(totalUSD)}</p>
          </div>
        </div>

        {/* Category chart */}
        <div className="mx-4 mb-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 px-4">
          <CategoryDonutChart
            slices={incomeSlices}
            totalARS={totalARS}
            totalUSD={totalUSD}
            currency={chartCurrency}
            onCurrencyChange={setChartCurrency}
            emptyMessage="Sin ingresos"
          />
        </div>

        {error && (
          <div className="mx-4 mb-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-stone-900 border-t border-b border-stone-200 dark:border-stone-800">
          {incomes.length === 0 ? (
            <p className="text-center text-stone-400 dark:text-stone-500 py-12 text-sm">Sin ingresos registrados</p>
          ) : (
            incomes.map((income, index) => (
              <div
                key={income.id}
                className={`flex items-start gap-3 px-4 py-3.5 ${index < incomes.length - 1 ? 'border-b border-stone-100 dark:border-stone-800' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-stone-900 dark:text-stone-50 truncate">{income.description}</p>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${chartCurrency === 'ARS' ? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                          {chartCurrency}
                        </span>
                        <p className="font-semibold text-green-600 text-sm leading-tight">
                          {chartCurrency === 'ARS' ? formatCurrency(income.amountInPesos) : formatUSD(income.amountInDollars || 0)}
                        </p>
                      </div>
                      <p className="text-xs text-stone-400 dark:text-stone-500 leading-tight">
                        {chartCurrency === 'ARS'
                          ? (income.amountInDollars != null ? formatUSD(income.amountInDollars) : '')
                          : formatCurrency(income.amountInPesos)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-stone-400 dark:text-stone-500 flex-shrink-0">{formatDate(income.date)}</span>
                      {income.source?.name && (
                        <span className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded truncate max-w-[100px]">
                          {income.source.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button onClick={() => handleEdit(income)} className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(income)} className="p-1.5 text-stone-400 hover:text-red-500 transition-colors">
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
  const columns: TableColumn<Income>[] = [
    { key: 'date', label: 'Fecha', render: (value: string) => formatDate(value) },
    {
      key: 'description', label: 'Descripción',
      render: (value: string) => <span className="font-medium text-stone-900 dark:text-stone-50">{value}</span>,
    },
    {
      key: 'amountInPesos', label: 'Monto',
      render: (value: number, row: Income) => (
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
      key: 'source', label: 'Fuente',
      render: (value: any) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          {value?.name || 'Sin fuente'}
        </span>
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
            <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2 flex items-center gap-3"><TrendingUp size={36} className="text-teal-700 dark:text-teal-400" />Ingresos</h1>
            <p className="text-stone-600 dark:text-stone-400">Registra y administra tus ingresos</p>
          </div>
          <MonthPicker year={selectedYear} month={selectedMonth} onChange={handleMonthChange} />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-6 animate-fade-in">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm mb-6 animate-fade-in flex divide-x divide-stone-100 dark:divide-stone-800">
          <div className="flex-1 px-5 py-4">
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-0.5">Total (ARS)</p>
            <p className="text-lg font-bold text-stone-900 dark:text-stone-50 leading-tight">{formatCurrency(totalARS)}</p>
          </div>
          <div className="flex-1 px-5 py-4">
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-0.5">Total (USD)</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400 leading-tight">{formatUSD(totalUSD)}</p>
          </div>
          <div className="flex-1 px-5 py-4">
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-0.5">Cantidad</p>
            <p className="text-lg font-bold text-stone-900 dark:text-stone-50 leading-tight">{totalElements} ingresos</p>
          </div>
          <div className="flex-1 px-5 py-4">
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-0.5">Promedio por Ingreso</p>
            <p className="text-lg font-bold text-stone-900 dark:text-stone-50 leading-tight">
              {incomes.length > 0 ? formatCurrency(totalARS / incomes.length) : formatCurrency(0)}
            </p>
          </div>
        </div>

        <div className="card animate-fade-in mb-6">
          <CategoryDonutChart
            slices={incomeSlices}
            totalARS={totalARS}
            totalUSD={totalUSD}
            currency={chartCurrency}
            onCurrencyChange={setChartCurrency}
            emptyMessage="Sin ingresos"
            layout="horizontal"
          />
        </div>

        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            Mostrando <span className="font-semibold text-stone-900 dark:text-stone-50">{incomes.length}</span> de{' '}
            <span className="font-semibold">{totalElements}</span> ingresos
            {totalPages > 1 && <span> - Página {currentPage + 1} de {totalPages}</span>}
          </div>
          <button onClick={handleCreate} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Registrar Ingreso
            </span>
          </button>
        </div>

        <div className="card animate-fade-in">
          <Table columns={columns} data={incomes} onEdit={handleEdit} onDelete={handleDelete} />
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
