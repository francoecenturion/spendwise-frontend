import { useState, useEffect } from 'react';
import { Repeat2 } from 'lucide-react';
import { recurrentExpenseService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import RecurrentExpenseForm from '../components/RecurrentExpenseForm.tsx';
import CategoryDonutChart, { DonutSlice } from '../components/CategoryDonutChart.tsx';
import { RecurrentExpense, TableColumn } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

const formatCurrency = (amount?: number) =>
  amount != null
    ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount)
    : '—';

const formatUSD = (amount?: number) =>
  amount != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)
    : '—';

const isUSD = (item: { amountInDollars?: number }) => item.amountInDollars != null;

export default function RecurrentExpenseList() {
  const isMobile = useIsMobile();

  const [items, setItems] = useState<RecurrentExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RecurrentExpense | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RecurrentExpense | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const chartSlices: DonutSlice[] = (() => {
    const map = new Map<string, { ars: number; usd: number; icon?: string }>();
    items.forEach(item => {
      const key = item.category?.name || 'Sin categoría';
      const icon = item.category?.icon || undefined;
      const ars = item.amountInPesos ?? 0;
      const usd = item.amountInDollars ?? 0;
      const existing = map.get(key);
      if (existing) { existing.ars += ars; existing.usd += usd; }
      else { map.set(key, { ars, usd, icon }); }
    });
    return Array.from(map.entries()).map(([label, { ars, usd, icon }]) => ({ label, valueARS: ars, valueUSD: usd, icon }));
  })();

  const totalARS = items.reduce((s, i) => s + (i.amountInPesos ?? 0), 0);
  const totalUSD = items.reduce((s, i) => s + (i.amountInDollars ?? 0), 0);

  useEffect(() => {
    loadItems();
  }, [currentPage]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await recurrentExpenseService.getAll({}, currentPage, 20);
      setItems(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err) {
      setError('Error al cargar los gastos recurrentes.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: RecurrentExpense) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (item: RecurrentExpense) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete?.id) return;
    try {
      await recurrentExpenseService.delete(itemToDelete.id);
      loadItems();
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el gasto recurrente');
    }
  };

  const handleSubmit = async (formData: RecurrentExpense) => {
    try {
      if (selectedItem?.id) {
        await recurrentExpenseService.update(selectedItem.id, formData);
        if (formData.enabled !== selectedItem.enabled) {
          if (formData.enabled) {
            await recurrentExpenseService.enable(selectedItem.id);
          } else {
            await recurrentExpenseService.disable(selectedItem.id);
          }
        }
      } else {
        await recurrentExpenseService.create(formData);
      }
      loadItems();
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error(err);
      alert('Error al guardar el gasto recurrente');
    }
  };

  const modals = (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedItem ? 'Editar Gasto Recurrente' : 'Nuevo Gasto Recurrente'}
      >
        <RecurrentExpenseForm
          recurrentExpense={selectedItem}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
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
      <button
        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
        disabled={currentPage === 0}
        className="btn btn-secondary disabled:opacity-50 py-1.5 px-4 text-sm"
      >Anterior</button>
      <span className="text-sm text-stone-500 dark:text-stone-400">{currentPage + 1} / {totalPages}</span>
      <button
        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
        disabled={currentPage >= totalPages - 1}
        className="btn btn-secondary disabled:opacity-50 py-1.5 px-4 text-sm"
      >Siguiente</button>
    </div>
  );

  // ── MOBILE VIEW ─────────────────────────────────────────────────────────────
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
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2"><Repeat2 size={22} className="text-teal-700 dark:text-teal-400" />Gastos Recurrentes</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{totalElements} registros</p>
          </div>
          <button
            onClick={handleCreate}
            className="w-9 h-9 bg-teal-700 dark:bg-teal-600 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-4 mb-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {items.length > 0 && (
          <div className="mx-4 mb-4 card">
            <CategoryDonutChart slices={chartSlices} totalARS={totalARS} totalUSD={totalUSD} layout="vertical" />
          </div>
        )}

        <div className="bg-white dark:bg-stone-900 border-t border-b border-stone-200 dark:border-stone-800">
          {items.length === 0 ? (
            <p className="text-center text-stone-400 dark:text-stone-500 py-12 text-sm">Sin gastos recurrentes</p>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 px-4 py-3.5 ${index < items.length - 1 ? 'border-b border-stone-100 dark:border-stone-800' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden">
                  {item.icon ? (
                    item.icon.startsWith('http') || item.icon.startsWith('data:') ? (
                      <img src={item.icon} alt={item.description} className="w-10 h-10 object-cover" />
                    ) : (
                      <span className="text-xl">{item.icon}</span>
                    )
                  ) : (
                    <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900 dark:text-stone-50 truncate">{item.description}</p>
                      {item.dayOfMonth != null && (
                        <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Vence el día {item.dayOfMonth}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isUSD(item) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
                        {isUSD(item) ? 'USD' : 'ARS'}
                      </span>
                      <p className="font-semibold text-red-600 dark:text-red-400 text-sm leading-tight">
                        {isUSD(item) ? formatUSD(item.amountInDollars) : formatCurrency(item.amountInPesos)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        {item.category?.name && (
                          <span className="text-xs bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 px-1.5 py-0.5 rounded truncate max-w-[100px]">
                            {item.category.name}
                          </span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${item.enabled ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-stone-100 text-stone-400 dark:bg-stone-800'}`}>
                          {item.enabled ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      {item.paymentMethod?.name && (
                        <div className="flex items-center gap-1">
                          {item.paymentMethod.issuingEntity?.icon && (
                            <img src={item.paymentMethod.issuingEntity.icon} alt="" className="w-4 h-4 rounded object-cover flex-shrink-0" />
                          )}
                          <span className="text-xs text-stone-400 dark:text-stone-500 truncate">{item.paymentMethod.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
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

  // ── DESKTOP VIEW ────────────────────────────────────────────────────────────
  const columns: TableColumn<RecurrentExpense>[] = [
    {
      key: 'icon', label: 'Ícono',
      render: (_value: any, row: RecurrentExpense) => {
        const icon = row.icon;
        if (!icon) {
          return (
            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          );
        }
        if (icon.startsWith('http') || icon.startsWith('data:')) {
          return <img src={icon} alt="" className="w-8 h-8 rounded-full object-cover" />;
        }
        return <span className="text-2xl">{icon}</span>;
      },
    },
    {
      key: 'description', label: 'Descripción',
      render: (value: string) => <span className="font-medium text-stone-900 dark:text-stone-50">{value}</span>,
    },
    {
      key: 'dayOfMonth', label: 'Vence el día',
      render: (value: number | undefined) => value != null
        ? <span className="text-stone-600 dark:text-stone-400">Día {value}</span>
        : <span className="text-stone-400 dark:text-stone-500">—</span>,
    },
    {
      key: 'amountInPesos', label: 'Monto',
      render: (_value: number, row: RecurrentExpense) => (
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isUSD(row) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
            {isUSD(row) ? 'USD' : 'ARS'}
          </span>
          <span className="font-semibold text-red-700 dark:text-red-400">
            {isUSD(row) ? formatUSD(row.amountInDollars) : formatCurrency(row.amountInPesos)}
          </span>
        </div>
      ),
    },
    {
      key: 'category', label: 'Categoría',
      render: (value: any) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {value?.name || '—'}
        </span>
      ),
    },
    {
      key: 'paymentMethod', label: 'Medio de Pago',
      render: (value: any) => value?.name ? (
        <div className="flex items-center gap-1.5">
          {value.issuingEntity?.icon && <img src={value.issuingEntity.icon} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />}
          <span className="text-sm text-stone-600 dark:text-stone-400">{value.name}</span>
        </div>
      ) : <span className="text-stone-400">—</span>,
    },
    {
      key: 'enabled', label: 'Estado',
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
          {value ? 'Activo' : 'Inactivo'}
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
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2 flex items-center gap-3"><Repeat2 size={36} className="text-teal-700 dark:text-teal-400" />Gastos Recurrentes</h1>
          <p className="text-stone-600 dark:text-stone-400">Registra tus gastos fijos mensuales</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-6 animate-fade-in">
            {error}
          </div>
        )}

        {items.length > 0 && (
          <div className="card mb-6 animate-fade-in">
            <CategoryDonutChart slices={chartSlices} totalARS={totalARS} totalUSD={totalUSD} layout="horizontal" />
          </div>
        )}

        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            <span className="font-semibold text-stone-900 dark:text-stone-50">{totalElements}</span> gastos recurrentes
            {totalPages > 1 && <span> — Página {currentPage + 1} de {totalPages}</span>}
          </div>
          <button onClick={handleCreate} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Gasto Recurrente
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
