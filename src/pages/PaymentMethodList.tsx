import { useState, useEffect } from 'react';
import { paymentMethodService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import PaymentMethodForm from '../components/PaymentMethodForm.tsx';
import { PaymentMethod, TableColumn, PaymentMethodType, PaymentMethodFilter, IssuingEntity } from '../types';
import { useDebounce } from '../hooks/useDebounce';

export default function PaymentMethodList() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [paymentMethodToDelete, setPaymentMethodToDelete] = useState<PaymentMethod | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filtros
  const [filters, setFilters] = useState<PaymentMethodFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  // Filtro de nombre con debounce
  const [nameFilter, setNameFilter] = useState('');
  const debouncedNameFilter = useDebounce(nameFilter, 500);

  // Aplicar el debounce al filtro de nombre
  useEffect(() => {
    setFilters(prev => ({ ...prev, name: debouncedNameFilter || undefined }));
    setCurrentPage(0);
  }, [debouncedNameFilter]);

  const paymentTypeLabels: Record<PaymentMethodType, string> = {
    [PaymentMethodType.CREDIT_CARD]: 'Crédito',
    [PaymentMethodType.DEBIT_CARD]: 'Débito',
    [PaymentMethodType.CASH]: 'Efectivo',
    [PaymentMethodType.TRANSFER]: 'Transferencia',
  };

  const columns: TableColumn<PaymentMethod>[] = [
    { key: 'id', label: 'ID' },
    {
      key: 'icon',
      label: 'Ícono',
      render: (value: string) => {
        const isCustomImage = value && (value.startsWith('data:image') || value.startsWith('http'));

        return isCustomImage ? (
          <img
            src={value}
            alt="Ícono"
            className="w-8 h-8 object-cover rounded"
          />
        ) : (
          <span className="text-2xl">{value || '💳'}</span>
        );
      }
    },
    {
      key: 'name',
      label: 'Nombre',
      render: (value: string) => (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100">
          {value}
        </span>
      ),
    },
    {
      key: 'issuingEntity',
      label: 'Entidad Emisora',
      render: (value: IssuingEntity) => (
        <span className="text-sm text-stone-600 dark:text-stone-400">{value?.description || <span className="text-stone-400 dark:text-stone-500 italic">—</span>}</span>
      ),
    },
    {
      key: 'brand',
      label: 'Emisor',
      render: (value: string) => (
        <span className="text-sm text-stone-600 dark:text-stone-400">{value || <span className="text-stone-400 dark:text-stone-500 italic">—</span>}</span>
      ),
    },
    {
      key: 'paymentMethodType',
      label: 'Tipo',
      render: (value: string) => (
        <span className="text-sm text-stone-600 dark:text-stone-400">
          {paymentTypeLabels[value as PaymentMethodType] || value}
        </span>
      )
    },
    {
      key: 'enabled',
      label: 'Estado',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {value ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
  ];

  useEffect(() => {
    loadPaymentMethods();
  }, [currentPage, filters]);

  const loadPaymentMethods = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await paymentMethodService.getAll(filters, currentPage, 20);
      setPaymentMethods(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err) {
      setError('Error al cargar los métodos de pago. Verifica que el backend esté corriendo.');
      console.error('Error loading payment methods:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof PaymentMethodFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setFilters({});
    setNameFilter('');
    setCurrentPage(0);
  };

  const handleCreate = (): void => {
    setSelectedPaymentMethod(null);
    setIsModalOpen(true);
  };

  const handleEdit = (paymentMethod: PaymentMethod): void => {
    setSelectedPaymentMethod(paymentMethod);
    setIsModalOpen(true);
  };

  const handleDelete = (paymentMethod: PaymentMethod): void => {
    setPaymentMethodToDelete(paymentMethod);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!paymentMethodToDelete?.id) return;

    try {
      await paymentMethodService.delete(paymentMethodToDelete.id);
      loadPaymentMethods();
      setIsDeleteModalOpen(false);
      setPaymentMethodToDelete(null);
    } catch (err) {
      console.error('Error deleting payment method:', err);
      alert('Error al eliminar el método de pago');
    }
  };

  const handleSubmit = async (formData: PaymentMethod): Promise<void> => {
    try {
      if (selectedPaymentMethod?.id) {
        const enabledChanged = formData.enabled !== selectedPaymentMethod.enabled;
        await paymentMethodService.update(selectedPaymentMethod.id, formData);
        if (enabledChanged) {
          if (formData.enabled === false) {
            await paymentMethodService.disable(selectedPaymentMethod.id);
          } else {
            await paymentMethodService.enable(selectedPaymentMethod.id);
          }
        }
      } else {
        await paymentMethodService.create(formData);
      }
      loadPaymentMethods();
      setIsModalOpen(false);
      setSelectedPaymentMethod(null);
    } catch (err) {
      console.error('Error saving payment method:', err);
      alert('Error al guardar el método de pago');
    }
  };

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
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2">Métodos de Pago</h1>
          <p className="text-stone-600 dark:text-stone-400">Administra tus tarjetas y formas de pago</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-6 animate-fade-in">
            {error}
          </div>
        )}

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
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Nombre</label>
                <input
                  type="text"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="input-field"
                  placeholder="Buscar por nombre..."
                />
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  ⏱️ La búsqueda se aplica 0.5s después de dejar de escribir
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Tipo</label>
                <select
                  value={filters.paymentMethodType || ''}
                  onChange={(e) => handleFilterChange('paymentMethodType', e.target.value || undefined)}
                  className="input-field"
                >
                  <option value="">Todos</option>
                  {Object.values(PaymentMethodType).map((type) => (
                    <option key={type} value={type}>
                      {paymentTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Estado</label>
                <select
                  value={filters.enabled === undefined ? '' : filters.enabled ? 'true' : 'false'}
                  onChange={(e) => handleFilterChange('enabled', e.target.value === '' ? undefined : e.target.value === 'true')}
                  className="input-field"
                >
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>

              <div className="md:col-span-3 flex gap-2">
                <button onClick={clearFilters} className="btn btn-secondary">
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            Total: <span className="font-semibold text-stone-900 dark:text-stone-50">{totalElements}</span> métodos
            {totalPages > 1 && <span> - Página {currentPage + 1} de {totalPages}</span>}
          </div>
          <button onClick={handleCreate} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Método
            </span>
          </button>
        </div>

        <div className="card animate-fade-in">
          <Table
            columns={columns}
            data={paymentMethods}
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
            <span className="text-sm text-stone-600 dark:text-stone-400">
              Página {currentPage + 1} de {totalPages}
            </span>
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
          title={selectedPaymentMethod ? 'Editar Método de Pago' : 'Crear Método de Pago'}
        >
          <PaymentMethodForm
            paymentMethod={selectedPaymentMethod}
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
              ¿Estás seguro de que deseas eliminar <span className="font-semibold">{paymentMethodToDelete?.name}</span>?
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
