import { useState, useEffect } from 'react';
import { PiggyBank } from 'lucide-react';
import { savingService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import SavingForm from '../components/SavingForm.tsx';
import CategoryDonutChart, { DonutSlice } from '../components/CategoryDonutChart.tsx';
import { Saving, SavingFilter, TableColumn } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount);

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);

const isUSD = (s: Saving) => {
  const name = (s.currency?.name || '').toLowerCase();
  return !name.includes('peso') && !name.includes('ars') && !name.includes('argentino');
};

export default function SavingList() {
  const isMobile = useIsMobile();

  const [savings, setSavings] = useState<Saving[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [savingToDelete, setSavingToDelete] = useState<Saving | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [filters] = useState<SavingFilter>({});

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  };

  const columns: TableColumn<Saving>[] = [
    {
      key: 'date',
      label: 'Fecha',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (value: string) => (
        <span className="font-medium text-stone-900 dark:text-stone-50">{value}</span>
      ),
    },
    {
      key: 'amountInPesos',
      label: 'Monto',
      render: (_value: number, row: Saving) => (
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isUSD(row) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
            {isUSD(row) ? 'USD' : 'ARS'}
          </span>
          <span className="font-semibold text-stone-900 dark:text-stone-50">
            {isUSD(row) ? formatUSD(row.amountInDollars || 0) : formatCurrency(row.amountInPesos)}
          </span>
        </div>
      ),
    },
    {
      key: 'savingsWallet',
      label: 'Billetera',
      render: (value: any) => (
        <span className="text-stone-600 dark:text-stone-400 text-sm">
          {value?.name || <span className="text-stone-400 dark:text-stone-500 italic">Sin asignar</span>}
        </span>
      ),
    },
  ];

  useEffect(() => {
    loadSavings();
  }, [currentPage, filters]);

  const loadSavings = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await savingService.getAll(filters, currentPage, 20);
      setSavings(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err) {
      setError('Error al cargar los ahorros. Verifica que el backend esté corriendo.');
      console.error('Error loading savings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (): void => {
    setSelectedSaving(null);
    setIsModalOpen(true);
  };

  const handleEdit = (saving: Saving): void => {
    setSelectedSaving(saving);
    setIsModalOpen(true);
  };

  const handleDelete = (saving: Saving): void => {
    setSavingToDelete(saving);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!savingToDelete?.id) return;
    try {
      await savingService.delete(savingToDelete.id);
      loadSavings();
      setIsDeleteModalOpen(false);
      setSavingToDelete(null);
    } catch (err) {
      console.error('Error deleting saving:', err);
      alert('Error al eliminar el ahorro');
    }
  };

  const handleSubmit = async (formData: Saving): Promise<void> => {
    try {
      if (selectedSaving?.id) {
        await savingService.update(selectedSaving.id, formData);
      } else {
        await savingService.create(formData);
      }
      loadSavings();
      setIsModalOpen(false);
      setSelectedSaving(null);
    } catch (err) {
      console.error('Error saving saving:', err);
      alert('Error al guardar el ahorro');
    }
  };

  const totalARS = savings.filter(s => !isUSD(s)).reduce((sum, s) => sum + s.amountInPesos, 0);
  const totalUSD = savings.filter(s => isUSD(s)).reduce((sum, s) => sum + (s.amountInDollars || 0), 0);

  const chartSlices: DonutSlice[] = (() => {
    const map = new Map<string, { ars: number; usd: number; icon?: string }>();
    savings.forEach(s => {
      const key = s.savingsWallet?.name || 'Sin billetera';
      const icon = s.savingsWallet?.icon || undefined;
      const existing = map.get(key);
      if (existing) {
        existing.ars += isUSD(s) ? 0 : s.amountInPesos;
        existing.usd += isUSD(s) ? (s.amountInDollars || 0) : 0;
      } else {
        map.set(key, {
          ars: isUSD(s) ? 0 : s.amountInPesos,
          usd: isUSD(s) ? (s.amountInDollars || 0) : 0,
          icon,
        });
      }
    });
    return Array.from(map.entries()).map(([label, { ars, usd, icon }]) => ({ label, valueARS: ars, valueUSD: usd, icon }));
  })();

  const modals = (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSaving ? 'Editar Ahorro' : 'Registrar Ahorro'}
      >
        <SavingForm
          saving={selectedSaving}
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
            ¿Estás seguro de que deseas eliminar el ahorro <span className="font-semibold">{savingToDelete?.description}</span>?
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
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2"><PiggyBank size={22} className="text-teal-700 dark:text-teal-400" />Ahorros</h1>
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

        {savings.length > 0 && (
          <div className="mx-4 mb-4 card">
            <CategoryDonutChart slices={chartSlices} totalARS={totalARS} totalUSD={totalUSD} layout="vertical" />
          </div>
        )}

        <div className="px-4 space-y-2.5">
          {savings.length === 0 ? (
            <p className="text-center text-stone-400 dark:text-stone-500 py-12 text-sm">Sin ahorros registrados</p>
          ) : (
            savings.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3.5 bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800"
              >
                <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-stone-500 dark:text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900 dark:text-stone-50 truncate">{item.description}</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{formatDate(item.date)}</p>
                      {item.savingsWallet?.name && (
                        <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{item.savingsWallet.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isUSD(item) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
                        {isUSD(item) ? 'USD' : 'ARS'}
                      </span>
                      <p className="font-semibold text-green-700 dark:text-green-400 text-sm leading-tight">
                        {isUSD(item) ? formatUSD(item.amountInDollars || 0) : formatCurrency(item.amountInPesos)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end mt-1">
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(item)} className="p-1.5 text-stone-400 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 dark:border-stone-100"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2 flex items-center gap-3"><PiggyBank size={36} className="text-teal-700 dark:text-teal-400" />Ahorros</h1>
          <p className="text-stone-600 dark:text-stone-400">Registra y seguí el crecimiento de tus ahorros</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-6 animate-fade-in">
            {error}
          </div>
        )}

        {savings.length > 0 && (
          <div className="card mb-6 animate-fade-in">
            <CategoryDonutChart slices={chartSlices} totalARS={totalARS} totalUSD={totalUSD} layout="horizontal" />
          </div>
        )}

        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            <span className="font-semibold text-stone-900 dark:text-stone-50">{totalElements}</span> ahorros
            {totalPages > 1 && <span> — Página {currentPage + 1} de {totalPages}</span>}
          </div>
          <button onClick={handleCreate} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Registrar Ahorro
            </span>
          </button>
        </div>

        <div className="card animate-fade-in">
          <Table columns={columns} data={savings} onEdit={handleEdit} onDelete={handleDelete} />
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="btn btn-secondary disabled:opacity-50"
            >Anterior</button>
            <span className="text-sm text-stone-600 dark:text-stone-400">Página {currentPage + 1} de {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="btn btn-secondary disabled:opacity-50"
            >Siguiente</button>
          </div>
        )}

        {modals}
      </div>
    </div>
  );
}
