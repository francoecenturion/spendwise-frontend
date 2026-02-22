import { useState, useEffect } from 'react';
import { savingService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import SavingForm from '../components/SavingForm.tsx';
import { Saving, SavingFilter, TableColumn } from '../types';
import { useDebounce } from '../hooks/useDebounce';

export default function SavingList() {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [savingToDelete, setSavingToDelete] = useState<Saving | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filtros
  const [filters, setFilters] = useState<SavingFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const debouncedDescription = useDebounce(descriptionFilter, 500);

  useEffect(() => {
    setFilters(prev => ({ ...prev, description: debouncedDescription || undefined }));
    setCurrentPage(0);
  }, [debouncedDescription]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount);

  const formatUSD = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);

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
      label: 'Monto (ARS)',
      render: (value: number) => (
        <span className="font-semibold text-green-700">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'amountInDollars',
      label: 'Monto (USD)',
      render: (value: number | undefined) => (
        <span className="font-semibold text-blue-700">
          {value ? formatUSD(value) : 'N/A'}
        </span>
      ),
    },
    {
      key: 'currency',
      label: 'Moneda',
      render: (value: any) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          {value?.symbol || value?.name || 'N/A'}
        </span>
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

  const handleFilterChange = (key: keyof SavingFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setFilters({});
    setDescriptionFilter('');
    setCurrentPage(0);
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

  const totalARS = savings.reduce((sum, s) => sum + s.amountInPesos, 0);
  const totalUSD = savings.reduce((sum, s) => sum + (s.amountInDollars || 0), 0);

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
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2">Ahorros</h1>
          <p className="text-stone-600 dark:text-stone-400">Registra y seguí el crecimiento de tus ahorros</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-6 animate-fade-in">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Total (ARS)</p>
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-50">{formatCurrency(totalARS)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Total (USD)</p>
                <p className="text-2xl font-bold text-blue-700">{formatUSD(totalUSD)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Registros</p>
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-50">{totalElements}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Promedio por Registro</p>
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-50">
                  {savings.length > 0 ? formatCurrency(totalARS / savings.length) : formatCurrency(0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="card mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Filtros</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50"
            >
              {showFilters ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Descripción</label>
                <input
                  type="text"
                  value={descriptionFilter}
                  onChange={(e) => setDescriptionFilter(e.target.value)}
                  className="input-field"
                  placeholder="Buscar por descripción..."
                />
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">⏱️ Se aplica 0.5s después de escribir</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Monto ARS mínimo</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={filters.minAmountInPesos || ''}
                  onChange={(e) => handleFilterChange('minAmountInPesos', e.target.value ? Number(e.target.value) : undefined)}
                  className="input-field"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Monto ARS máximo</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={filters.maxAmountInPesos || ''}
                  onChange={(e) => handleFilterChange('maxAmountInPesos', e.target.value ? Number(e.target.value) : undefined)}
                  className="input-field"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Fecha desde</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Fecha hasta</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="flex items-end">
                <button onClick={clearFilters} className="btn btn-secondary w-full">
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            Mostrando <span className="font-semibold text-stone-900 dark:text-stone-50">{savings.length}</span> de <span className="font-semibold">{totalElements}</span> registros
            {totalPages > 1 && <span> - Página {currentPage + 1} de {totalPages}</span>}
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
          <Table
            columns={columns}
            data={savings}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="btn btn-secondary disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-stone-600 dark:text-stone-400">Página {currentPage + 1} de {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="btn btn-secondary disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}

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
              ¿Estás seguro de que deseas eliminar el ahorro <span className="font-semibold">{savingToDelete?.description}</span> de <span className="font-semibold">{savingToDelete && formatCurrency(savingToDelete.amountInPesos)}</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 pt-4">
              <button onClick={confirmDelete} className="btn btn-danger flex-1">Eliminar</button>
              <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
