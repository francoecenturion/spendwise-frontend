import { useState, useEffect } from 'react';
import { debtService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import DebtForm from '../components/DebtForm.tsx';
import { Debt, DebtFilter, TableColumn } from '../types';
import { useDebounce } from '../hooks/useDebounce';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount);

const formatDate = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

export default function DebtList() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filtros
  const [filters, setFilters] = useState<DebtFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  const [descriptionFilter, setDescriptionFilter] = useState('');
  const debouncedDescriptionFilter = useDebounce(descriptionFilter, 500);

  useEffect(() => {
    setFilters(prev => ({ ...prev, description: debouncedDescriptionFilter || undefined }));
    setCurrentPage(0);
  }, [debouncedDescriptionFilter]);

  const columns: TableColumn<Debt>[] = [
    {
      key: 'date',
      label: 'Fecha',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (value: string) => <span className="font-medium text-stone-900 dark:text-stone-50">{value}</span>,
    },
    {
      key: 'personal',
      label: 'Acreedor',
      render: (_: boolean, row: Debt) => (
        <span className="text-stone-700 dark:text-stone-300">
          {row.personal ? (row.creditor || '-') : (row.issuingEntity?.description || '-')}
        </span>
      ),
    },
    {
      key: 'personal',
      label: 'Tipo',
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
      key: 'amountInPesos',
      label: 'Monto (ARS)',
      render: (value: number) => (
        <span className="font-semibold text-red-700">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Vencimiento',
      render: (value: string | undefined) => value ? formatDate(value) : '-',
    },
    {
      key: 'cancelled',
      label: 'Estado',
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

  useEffect(() => {
    loadDebts();
  }, [currentPage, filters]);

  const loadDebts = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await debtService.getAll(filters, currentPage, 20);
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

  const handleFilterChange = (key: keyof DebtFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setFilters({});
    setDescriptionFilter('');
    setCurrentPage(0);
  };

  const handleCreate = (): void => {
    setSelectedDebt(null);
    setIsModalOpen(true);
  };

  const handleEdit = (debt: Debt): void => {
    setSelectedDebt(debt);
    setIsModalOpen(true);
  };

  const handleDelete = (debt: Debt): void => {
    setDebtToDelete(debt);
    setIsDeleteModalOpen(true);
  };

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

  const totalPending = debts
    .filter(d => !d.cancelled)
    .reduce((sum, d) => sum + d.amountInPesos, 0);

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
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2">Deudas</h1>
          <p className="text-stone-600 dark:text-stone-400">Administra tus deudas personales e institucionales</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-6 animate-fade-in">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Total deudas</p>
            <p className="text-2xl font-bold text-stone-900 dark:text-stone-50">{totalElements}</p>
          </div>
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Pendientes (ARS)</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(totalPending)}</p>
          </div>
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Pendientes</p>
            <p className="text-2xl font-bold text-stone-900 dark:text-stone-50">{debts.filter(d => !d.cancelled).length}</p>
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
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Tipo</label>
                <select
                  value={filters.personal === undefined ? '' : filters.personal ? 'true' : 'false'}
                  onChange={(e) => handleFilterChange('personal', e.target.value === '' ? undefined : e.target.value === 'true')}
                  className="input-field"
                >
                  <option value="">Todas</option>
                  <option value="true">Personal</option>
                  <option value="false">Institucional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Estado</label>
                <select
                  value={filters.cancelled === undefined ? '' : filters.cancelled ? 'true' : 'false'}
                  onChange={(e) => handleFilterChange('cancelled', e.target.value === '' ? undefined : e.target.value === 'true')}
                  className="input-field"
                >
                  <option value="">Todas</option>
                  <option value="false">Pendientes</option>
                  <option value="true">Canceladas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Desde</label>
                <input
                  type="date"
                  value={filters.startDate ?? ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Hasta</label>
                <input
                  type="date"
                  value={filters.endDate ?? ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
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
          <Table
            columns={columns}
            data={debts}
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
          title={selectedDebt ? 'Editar Deuda' : 'Registrar Deuda'}
        >
          <DebtForm
            debt={selectedDebt}
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
              ¿Estás seguro de que deseas eliminar la deuda{' '}
              <span className="font-semibold">{debtToDelete?.description}</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 pt-4">
              <button onClick={confirmDelete} className="btn btn-danger flex-1">
                Eliminar
              </button>
              <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
