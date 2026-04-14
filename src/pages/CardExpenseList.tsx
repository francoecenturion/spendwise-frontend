import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { cardExpenseService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import CardExpenseForm from '../components/CardExpenseForm.tsx';
import CategoryDonutChart, { DonutSlice } from '../components/CategoryDonutChart.tsx';
import MonthPicker, { monthBounds } from '../components/MonthPicker.tsx';
import { CardExpense, CardExpenseFilter, TableColumn } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount);

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);

const formatDate = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

export default function CardExpenseList() {
  const isMobile = useIsMobile();
  const location = useLocation();

  const [items, setItems] = useState<CardExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<CardExpense | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<CardExpense | null>(null);

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
      setSelectedItem(null);
      setIsModalOpen(true);
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search]);

  useEffect(() => {
    loadItems();
  }, [currentPage, selectedYear, selectedMonth]);

  const loadItems = async (): Promise<void> => {
    try {
      setLoading(true);
      const { startDate, endDate } = monthBounds(selectedYear, selectedMonth);
      const response = await cardExpenseService.getAll({ startDate, endDate } as CardExpenseFilter, currentPage, 20);
      setItems(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err) {
      setError('Error al cargar los gastos. Verifica que el backend esté corriendo en http://localhost:8080');
      console.error('Error loading card expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (): void => { setSelectedItem(null); setIsModalOpen(true); };
  const handleEdit = (item: CardExpense): void => { setSelectedItem(item); setIsModalOpen(true); };
  const handleDelete = (item: CardExpense): void => { setItemToDelete(item); setIsDeleteModalOpen(true); };

  const confirmDelete = async (): Promise<void> => {
    if (!itemToDelete?.id) return;
    try {
      await cardExpenseService.delete(itemToDelete.id);
      loadItems();
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting card expense:', err);
      alert('Error al eliminar el gasto');
    }
  };

  const handleSubmit = async (formData: CardExpense): Promise<void> => {
    try {
      if (selectedItem?.id) {
        const cancelledChanged = formData.cancelled !== selectedItem.cancelled;
        await cardExpenseService.update(selectedItem.id, formData);
        if (cancelledChanged) {
          if (formData.cancelled === true) {
            await cardExpenseService.cancel(selectedItem.id);
          } else {
            await cardExpenseService.uncancel(selectedItem.id);
          }
        }
      } else {
        await cardExpenseService.create(formData);
      }
      loadItems();
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error saving card expense:', err);
      alert('Error al guardar el gasto');
    }
  };

  const pendingItems = items.filter(d => !d.cancelled);
  const totalPendingARS = pendingItems.filter(d => d.amountInDollars == null).reduce((sum, d) => sum + (d.amountInPesos ?? 0), 0);
  const totalPendingUSD = pendingItems.filter(d => d.amountInDollars != null).reduce((sum, d) => sum + (d.amountInDollars ?? 0), 0);

  const chartSlices: DonutSlice[] = (() => {
    const filtered = chartCurrency === 'ARS'
      ? pendingItems.filter(d => d.amountInDollars == null)
      : pendingItems.filter(d => d.amountInDollars != null);
    const map = new Map<string, number>();
    filtered.forEach(item => {
      const key = item.paymentMethod?.name || 'Sin tarjeta';
      const amount = chartCurrency === 'ARS' ? (item.amountInPesos ?? 0) : (item.amountInDollars ?? 0);
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedItem ? 'Editar Gasto con Tarjeta' : 'Registrar Gasto con Tarjeta'}>
        <CardExpenseForm item={selectedItem} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} />
      </Modal>
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Eliminación">
        <div className="space-y-4">
          <p className="text-stone-600 dark:text-stone-400">
            ¿Estás seguro de que deseas eliminar{' '}
            <span className="font-semibold">{itemToDelete?.description}</span>?
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
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <CreditCard size={22} className="text-teal-700 dark:text-teal-400" />Tarjetas
          </h1>
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

        <div className="mx-4 mb-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 px-4">
          <CategoryDonutChart
            slices={chartSlices}
            totalARS={totalPendingARS}
            totalUSD={totalPendingUSD}
            currency={chartCurrency}
            onCurrencyChange={setChartCurrency}
            emptyMessage="Sin gastos pendientes"
          />
        </div>

        {error && (
          <div className="mx-4 mb-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-stone-900 border-t border-b border-stone-200 dark:border-stone-800">
          {items.length === 0 ? (
            <p className="text-center text-stone-400 dark:text-stone-500 py-12 text-sm">Sin gastos registrados</p>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 px-4 py-3.5 ${index < items.length - 1 ? 'border-b border-stone-100 dark:border-stone-800' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  item.cancelled
                    ? 'bg-green-100 dark:bg-green-900/40'
                    : 'bg-blue-100 dark:bg-blue-900/40'
                }`}>
                  <CreditCard className={`w-5 h-5 ${item.cancelled ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-stone-900 dark:text-stone-50 truncate">{item.description}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.amountInDollars != null ? (
                        <>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">USD</span>
                          <p className="font-semibold text-blue-600 dark:text-blue-400 text-sm">{formatUSD(item.amountInDollars)}</p>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">ARS</span>
                          <p className="font-semibold text-blue-600 dark:text-blue-400 text-sm">{formatCurrency(item.amountInPesos ?? 0)}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className="text-xs text-stone-400 dark:text-stone-500">{formatDate(item.date)}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        item.cancelled
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      }`}>
                        {item.cancelled ? 'Saldado' : 'Pendiente'}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(item)} className="p-1.5 text-stone-400 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {item.paymentMethod?.name && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {item.paymentMethod.issuingEntity?.icon && (
                        <img src={item.paymentMethod.issuingEntity.icon} alt="" className="w-4 h-4 rounded object-cover flex-shrink-0" />
                      )}
                      <span className="text-xs text-stone-400 dark:text-stone-500 truncate">{item.paymentMethod.name}</span>
                    </div>
                  )}
                  {item.dueDate && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      Vence: {formatDate(item.dueDate)}
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
  const columns: TableColumn<CardExpense>[] = [
    { key: 'date', label: 'Fecha', render: (value: string) => formatDate(value) },
    {
      key: 'description', label: 'Descripción',
      render: (value: string) => <span className="font-medium text-stone-900 dark:text-stone-50">{value}</span>,
    },
    {
      key: 'paymentMethod', label: 'Tarjeta',
      render: (value: any) => value?.name ? (
        <div className="flex items-center gap-1.5">
          {value.issuingEntity?.icon && <img src={value.issuingEntity.icon} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />}
          <span className="text-sm text-stone-600 dark:text-stone-400">{value.name}</span>
        </div>
      ) : <span className="text-stone-400">—</span>,
    },
    {
      key: 'amountInPesos', label: 'Monto',
      render: (_: number, row: CardExpense) => (
        <div className="flex items-center gap-1.5">
          {row.amountInDollars != null ? (
            <>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">USD</span>
              <span className="font-semibold text-blue-700 dark:text-blue-400">{formatUSD(row.amountInDollars)}</span>
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">ARS</span>
              <span className="font-semibold text-blue-700 dark:text-blue-400">{formatCurrency(row.amountInPesos ?? 0)}</span>
            </>
          )}
        </div>
      ),
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
            : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
        }`}>
          {value ? 'Saldado' : 'Pendiente'}
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
            <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2 flex items-center gap-3">
              <CreditCard size={36} className="text-teal-700 dark:text-teal-400" />Gastos con Tarjeta
            </h1>
            <p className="text-stone-600 dark:text-stone-400">Administra tus gastos de crédito y débito</p>
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
            slices={chartSlices}
            totalARS={totalPendingARS}
            totalUSD={totalPendingUSD}
            currency={chartCurrency}
            onCurrencyChange={setChartCurrency}
            emptyMessage="Sin gastos pendientes"
            layout="horizontal"
          />
        </div>

        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            Total: <span className="font-semibold text-stone-900 dark:text-stone-50">{totalElements}</span> gastos
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
          <Table columns={columns} data={items} onEdit={handleEdit} onDelete={handleDelete} />
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
