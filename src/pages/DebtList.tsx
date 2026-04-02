import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { debtService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import DebtForm from '../components/DebtForm.tsx';
import CategoryDonutChart, { DonutSlice } from '../components/CategoryDonutChart.tsx';
import MonthPicker, { monthBounds } from '../components/MonthPicker.tsx';
import { Debt, DebtFilter, TableColumn } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount);

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);

const formatDate = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

export default function DebtList() {
  const isMobile = useIsMobile();
  const location = useLocation();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);

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
      setSelectedDebt(null);
      setIsModalOpen(true);
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search]);

  useEffect(() => {
    loadDebts();
  }, [currentPage, selectedYear, selectedMonth]);

  const loadDebts = async (): Promise<void> => {
    try {
      setLoading(true);
      const { startDate, endDate } = monthBounds(selectedYear, selectedMonth);
      const response = await debtService.getAll({ startDate, endDate } as DebtFilter, currentPage, 20);
      setDebts(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err) {
      setError('Error al cargar las deudas. Verifica que el backend esté corriendo en http://localhost:8080');
      console.error('Error loading debts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (): void => { setSelectedDebt(null); setIsModalOpen(true); };
  const handleEdit = (debt: Debt): void => { setSelectedDebt(debt); setIsModalOpen(true); };
  const handleDelete = (debt: Debt): void => { setDebtToDelete(debt); setIsDeleteModalOpen(true); };

  const confirmDelete = async (): Promise<void> => {
    if (!debtToDelete?.id) return;
    try {
      await debtService.delete(debtToDelete.id);
      loadDebts();
      setIsDeleteModalOpen(false);
      setDebtToDelete(null);
    } catch (err) {
      console.error('Error deleting debt:', err);
      alert('Error al eliminar la deuda');
    }
  };

  const handleSubmit = async (formData: Debt): Promise<void> => {
    try {
      if (selectedDebt?.id) {
        const cancelledChanged = formData.cancelled !== selectedDebt.cancelled;
        await debtService.update(selectedDebt.id, formData);
        if (cancelledChanged) {
          if (formData.cancelled === true) {
            await debtService.cancel(selectedDebt.id);
          } else {
            await debtService.uncancel(selectedDebt.id);
          }
        }
      } else {
        await debtService.create(formData);
      }
      loadDebts();
      setIsModalOpen(false);
      setSelectedDebt(null);
    } catch (err) {
      console.error('Error saving debt:', err);
      alert('Error al guardar la deuda');
    }
  };

  const pendingDebts = debts.filter(d => !d.cancelled);
  const totalPendingARS = pendingDebts.filter(d => d.amountInDollars == null).reduce((sum, d) => sum + (d.amountInPesos ?? 0), 0);
  const totalPendingUSD = pendingDebts.filter(d => d.amountInDollars != null).reduce((sum, d) => sum + (d.amountInDollars ?? 0), 0);

  const debtSlices: DonutSlice[] = (() => {
    const filtered = chartCurrency === 'ARS'
      ? pendingDebts.filter(d => d.amountInDollars == null)
      : pendingDebts.filter(d => d.amountInDollars != null);
    const map = new Map<string, number>();
    filtered.forEach(debt => {
      const key = debt.personal
        ? (debt.creditor || 'Personal')
        : (debt.issuingEntity?.description || 'Institucional');
      const amount = chartCurrency === 'ARS' ? (debt.amountInPesos ?? 0) : (debt.amountInDollars ?? 0);
      map.set(key, (map.get(key) || 0) + amount);
    });
    return Array.from(map.entries()).map(([label, value]) => ({
      label,
      valueARS: chartCurrency === 'ARS' ? value : 0,
      valueUSD: chartCurrency === 'USD' ? value : 0,
    }));
  })();

  const modals = (
    <>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedDebt ? 'Editar Deuda' : 'Registrar Deuda'}>
        <DebtForm debt={selectedDebt} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} />
      </Modal>
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Eliminación">
        <div className="space-y-4">
          <p className="text-stone-600 dark:text-stone-400">
            ¿Estás seguro de que deseas eliminar la deuda{' '}
            <span className="font-semibold">{debtToDelete?.description}</span>?
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
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Deudas</h1>
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

        <div className="mx-4 mb-3 bg-white dark:bg-stone-900 rounded-xl px-4 py-3 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400">Pendiente (ARS)</p>
            <p className="font-bold text-red-600 dark:text-red-400">{formatCurrency(totalPendingARS)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-stone-500 dark:text-stone-400">Pendiente (USD)</p>
            <p className="font-bold text-red-600 dark:text-red-400">{formatUSD(totalPendingUSD)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-500 dark:text-stone-400">Total</p>
            <p className="font-bold text-stone-900 dark:text-stone-50">{totalElements}</p>
          </div>
        </div>

        {/* Creditor chart */}
        <div className="mx-4 mb-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 px-4">
          <CategoryDonutChart
            slices={debtSlices}
            totalARS={totalPendingARS}
            totalUSD={totalPendingUSD}
            currency={chartCurrency}
            onCurrencyChange={setChartCurrency}
            emptyMessage="Sin deudas pendientes"
          />
        </div>

        {error && (
          <div className="mx-4 mb-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-stone-900 border-t border-b border-stone-200 dark:border-stone-800">
          {debts.length === 0 ? (
            <p className="text-center text-stone-400 dark:text-stone-500 py-12 text-sm">Sin deudas registradas</p>
          ) : (
            debts.map((debt, index) => (
              <div
                key={debt.id}
                className={`flex items-start gap-3 px-4 py-3.5 ${index < debts.length - 1 ? 'border-b border-stone-100 dark:border-stone-800' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  debt.cancelled
                    ? 'bg-green-100 dark:bg-green-900/40'
                    : 'bg-purple-100 dark:bg-purple-900/40'
                }`}>
                  <svg className={`w-5 h-5 ${debt.cancelled ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'}`}
                       fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-stone-900 dark:text-stone-50 truncate">{debt.description}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {debt.amountInDollars != null ? (
                        <>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">USD</span>
                          <p className="font-semibold text-purple-600 dark:text-purple-400 text-sm">{formatUSD(debt.amountInDollars)}</p>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">ARS</span>
                          <p className="font-semibold text-purple-600 dark:text-purple-400 text-sm">{formatCurrency(debt.amountInPesos ?? 0)}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className="text-xs text-stone-400 dark:text-stone-500">{formatDate(debt.date)}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        debt.cancelled
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {debt.cancelled ? 'Cancelada' : 'Pendiente'}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        debt.personal
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}>
                        {debt.personal ? 'Personal' : 'Institucional'}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button onClick={() => handleEdit(debt)} className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(debt)} className="p-1.5 text-stone-400 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {(debt.creditor || debt.issuingEntity?.description) && (
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 truncate">
                      {debt.personal ? debt.creditor : debt.issuingEntity?.description}
                    </p>
                  )}
                  {debt.paymentMethod?.name && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {debt.paymentMethod.issuingEntity?.icon && (
                        <span className="text-xs leading-none">{debt.paymentMethod.issuingEntity.icon}</span>
                      )}
                      <span className="text-xs text-stone-400 dark:text-stone-500 truncate">{debt.paymentMethod.name}</span>
                    </div>
                  )}
                  {debt.dueDate && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      Vence: {formatDate(debt.dueDate)}
                    </p>
                  )}
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
  const columns: TableColumn<Debt>[] = [
    { key: 'date', label: 'Fecha', render: (value: string) => formatDate(value) },
    {
      key: 'description', label: 'Descripción',
      render: (value: string) => <span className="font-medium text-stone-900 dark:text-stone-50">{value}</span>,
    },
    {
      key: 'personal', label: 'Acreedor',
      render: (_: boolean, row: Debt) => (
        <span className="text-stone-700 dark:text-stone-300">
          {row.personal ? (row.creditor || '-') : (row.issuingEntity?.description || '-')}
        </span>
      ),
    },
    {
      key: 'personal', label: 'Tipo',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        }`}>
          {value ? 'Personal' : 'Institucional'}
        </span>
      ),
    },
    {
      key: 'amountInPesos', label: 'Monto',
      render: (_: number, row: Debt) => (
        <div className="flex items-center gap-1.5">
          {row.amountInDollars != null ? (
            <>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">USD</span>
              <span className="font-semibold text-red-700 dark:text-red-400">{formatUSD(row.amountInDollars)}</span>
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">ARS</span>
              <span className="font-semibold text-red-700 dark:text-red-400">{formatCurrency(row.amountInPesos ?? 0)}</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'paymentMethod', label: 'Medio de Pago',
      render: (value: any) => value?.name ? (
        <div className="flex items-center gap-1.5">
          {value.issuingEntity?.icon && <span className="text-base leading-none">{value.issuingEntity.icon}</span>}
          <span className="text-sm text-stone-600 dark:text-stone-400">{value.name}</span>
        </div>
      ) : <span className="text-stone-400">—</span>,
    },
    {
      key: 'dueDate', label: 'Vencimiento',
      render: (value: string | undefined) => value ? formatDate(value) : '-',
    },
    {
      key: 'cancelled', label: 'Estado',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {value ? 'Cancelada' : 'Pendiente'}
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
            <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2">Deudas</h1>
            <p className="text-stone-600 dark:text-stone-400">Administra tus deudas personales e institucionales</p>
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
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-0.5">Total deudas</p>
            <p className="text-lg font-bold text-stone-900 dark:text-stone-50 leading-tight">{totalElements}</p>
          </div>
          <div className="flex-1 px-5 py-4">
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-0.5">Pendiente (ARS)</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400 leading-tight">{formatCurrency(totalPendingARS)}</p>
          </div>
          <div className="flex-1 px-5 py-4">
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-0.5">Pendiente (USD)</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400 leading-tight">{formatUSD(totalPendingUSD)}</p>
          </div>
          <div className="flex-1 px-5 py-4">
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-0.5">Pendientes</p>
            <p className="text-lg font-bold text-stone-900 dark:text-stone-50 leading-tight">{pendingDebts.length}</p>
          </div>
        </div>

        {/* Chart — full width */}
        <div className="card animate-fade-in mb-6">
          <CategoryDonutChart
            slices={debtSlices}
            totalARS={totalPendingARS}
            totalUSD={totalPendingUSD}
            currency={chartCurrency}
            onCurrencyChange={setChartCurrency}
            emptyMessage="Sin deudas pendientes"
            layout="horizontal"
          />
        </div>

        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            Total: <span className="font-semibold text-stone-900 dark:text-stone-50">{totalElements}</span> deudas
            {totalPages > 1 && <span> - Página {currentPage + 1} de {totalPages}</span>}
          </div>
          <button onClick={handleCreate} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Registrar Deuda
            </span>
          </button>
        </div>

        <div className="card animate-fade-in">
          <Table columns={columns} data={debts} onEdit={handleEdit} onDelete={handleDelete} />
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
