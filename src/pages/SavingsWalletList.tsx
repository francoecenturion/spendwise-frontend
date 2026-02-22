import { useState, useEffect } from 'react';
import { savingsWalletService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import SavingsWalletForm from '../components/SavingsWalletForm.tsx';
import { SavingsWallet, SavingsWalletType, SavingsWalletFilter, TableColumn } from '../types';
import { useDebounce } from '../hooks/useDebounce';

const walletTypeLabels: Record<SavingsWalletType, string> = {
  [SavingsWalletType.BANK_ACCOUNT]: 'Cuenta Bancaria',
  [SavingsWalletType.VIRTUAL_WALLET]: 'Billetera Virtual',
  [SavingsWalletType.MUTUAL_FUND]: 'Fondo Común de Inversión',
  [SavingsWalletType.FIXED_TERM]: 'Plazo Fijo',
  [SavingsWalletType.CASH]: 'Efectivo',
};

const walletTypeIcons: Record<SavingsWalletType, string> = {
  [SavingsWalletType.BANK_ACCOUNT]: '🏦',
  [SavingsWalletType.VIRTUAL_WALLET]: '📱',
  [SavingsWalletType.MUTUAL_FUND]: '📈',
  [SavingsWalletType.FIXED_TERM]: '🔒',
  [SavingsWalletType.CASH]: '💵',
};

export default function SavingsWalletList() {
  const [wallets, setWallets] = useState<SavingsWallet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedWallet, setSelectedWallet] = useState<SavingsWallet | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [walletToDelete, setWalletToDelete] = useState<SavingsWallet | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filtros
  const [filters, setFilters] = useState<SavingsWalletFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const debouncedNameFilter = useDebounce(nameFilter, 500);

  useEffect(() => {
    setFilters(prev => ({ ...prev, name: debouncedNameFilter || undefined }));
    setCurrentPage(0);
  }, [debouncedNameFilter]);

  const columns: TableColumn<SavingsWallet>[] = [
    { key: 'id', label: 'ID' },
    {
      key: 'icon',
      label: 'Ícono',
      render: (value: string, row: SavingsWallet) => (
        <span className="text-2xl">
          {value || walletTypeIcons[row.savingsWalletType as SavingsWalletType] || '💰'}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Nombre',
      render: (value: string) => (
        <span className="font-medium text-stone-900 dark:text-stone-50">{value}</span>
      ),
    },
    {
      key: 'savingsWalletType',
      label: 'Tipo',
      render: (value: string) => (
        <span className="text-sm text-stone-600 dark:text-stone-400">
          {walletTypeLabels[value as SavingsWalletType] || value}
        </span>
      ),
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
          {value ? 'Activa' : 'Inactiva'}
        </span>
      ),
    },
  ];

  useEffect(() => {
    loadWallets();
  }, [currentPage, filters]);

  const loadWallets = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await savingsWalletService.getAll(filters, currentPage, 20);
      setWallets(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err) {
      setError('Error al cargar las billeteras de ahorro. Verifica que el backend esté corriendo.');
      console.error('Error loading savings wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SavingsWalletFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setFilters({});
    setNameFilter('');
    setCurrentPage(0);
  };

  const handleCreate = (): void => {
    setSelectedWallet(null);
    setIsModalOpen(true);
  };

  const handleEdit = (wallet: SavingsWallet): void => {
    setSelectedWallet(wallet);
    setIsModalOpen(true);
  };

  const handleDelete = (wallet: SavingsWallet): void => {
    setWalletToDelete(wallet);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!walletToDelete?.id) return;
    try {
      await savingsWalletService.delete(walletToDelete.id);
      loadWallets();
      setIsDeleteModalOpen(false);
      setWalletToDelete(null);
    } catch (err) {
      console.error('Error deleting savings wallet:', err);
      alert('Error al eliminar la billetera');
    }
  };

  const handleSubmit = async (formData: SavingsWallet): Promise<void> => {
    try {
      if (selectedWallet?.id) {
        const enabledChanged = formData.enabled !== selectedWallet.enabled;
        await savingsWalletService.update(selectedWallet.id, formData);
        if (enabledChanged) {
          if (formData.enabled === false) {
            await savingsWalletService.disable(selectedWallet.id);
          } else {
            await savingsWalletService.enable(selectedWallet.id);
          }
        }
      } else {
        await savingsWalletService.create(formData);
      }
      loadWallets();
      setIsModalOpen(false);
      setSelectedWallet(null);
    } catch (err) {
      console.error('Error saving savings wallet:', err);
      alert('Error al guardar la billetera');
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
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2">Billeteras de Ahorro</h1>
          <p className="text-stone-600 dark:text-stone-400">Administra dónde tenés guardados tus ahorros</p>
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
                  value={filters.savingsWalletType || ''}
                  onChange={(e) => handleFilterChange('savingsWalletType', e.target.value || undefined)}
                  className="input-field"
                >
                  <option value="">Todos</option>
                  {Object.values(SavingsWalletType).map((type) => (
                    <option key={type} value={type}>
                      {walletTypeLabels[type]}
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
                  <option value="">Todas</option>
                  <option value="true">Activas</option>
                  <option value="false">Inactivas</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <button onClick={clearFilters} className="btn btn-secondary">
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            Total: <span className="font-semibold text-stone-900 dark:text-stone-50">{totalElements}</span> billeteras
            {totalPages > 1 && <span> - Página {currentPage + 1} de {totalPages}</span>}
          </div>
          <button onClick={handleCreate} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Billetera
            </span>
          </button>
        </div>

        <div className="card animate-fade-in">
          <Table
            columns={columns}
            data={wallets}
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
          title={selectedWallet ? 'Editar Billetera' : 'Agregar Billetera'}
        >
          <SavingsWalletForm
            savingsWallet={selectedWallet}
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
              ¿Estás seguro de que deseas eliminar <span className="font-semibold">{walletToDelete?.name}</span>?
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
