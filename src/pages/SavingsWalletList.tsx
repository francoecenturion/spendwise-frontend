import { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { savingsWalletService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import SavingsWalletForm from '../components/SavingsWalletForm.tsx';
import { SavingsWallet, SavingsWalletType, SavingsWalletFilter, TableColumn } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { useIsMobile } from '../hooks/useIsMobile';

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
  const isMobile = useIsMobile();

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
  const [nameFilter, setNameFilter] = useState('');
  const debouncedNameFilter = useDebounce(nameFilter, 500);

  useEffect(() => {
    setFilters(prev => ({ ...prev, name: debouncedNameFilter || undefined }));
    setCurrentPage(0);
  }, [debouncedNameFilter]);

  const columns: TableColumn<SavingsWallet>[] = [
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
      key: 'issuingEntity',
      label: 'Entidad',
      render: (_value: unknown, row?: SavingsWallet) => row?.issuingEntity ? (
        <span className="text-sm text-stone-700 dark:text-stone-300">
          {row.issuingEntity.icon ? `${row.issuingEntity.icon} ` : ''}{row.issuingEntity.description}
        </span>
      ) : <span className="text-stone-400 dark:text-stone-600 text-sm">—</span>,
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

  const modals = (
    <>
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
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2"><Wallet size={22} className="text-teal-700 dark:text-teal-400" />Billeteras / Cuentas Bancarias</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{totalElements} billeteras</p>
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

        <div className="px-4 pb-3">
          <input
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="input-field"
            placeholder="Buscar por nombre..."
          />
        </div>

        {error && (
          <div className="mx-4 mb-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="px-4 space-y-2.5">
          {wallets.length === 0 ? (
            <p className="text-center text-stone-400 dark:text-stone-500 py-12 text-sm">Sin billeteras de ahorro</p>
          ) : (
            wallets.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3.5 bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800"
              >
                <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xl flex-shrink-0 mt-0.5">
                  {item.icon || walletTypeIcons[item.savingsWalletType as SavingsWalletType] || '💰'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-stone-900 dark:text-stone-50 truncate">{item.name}</p>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
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
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-1.5 py-0.5 rounded">
                      {walletTypeLabels[item.savingsWalletType as SavingsWalletType] || item.savingsWalletType}
                    </span>
                    {item.issuingEntity && (
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        {item.issuingEntity.icon ? `${item.issuingEntity.icon} ` : ''}{item.issuingEntity.description}
                      </span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${item.enabled ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-stone-100 text-stone-400 dark:bg-stone-800'}`}>
                      {item.enabled ? 'Activa' : 'Inactiva'}
                    </span>
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
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2 flex items-center gap-3"><Wallet size={36} className="text-teal-700 dark:text-teal-400" />Billeteras / Cuentas Bancarias</h1>
          <p className="text-stone-600 dark:text-stone-400">Administra dónde tenés guardados tus ahorros</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-6 animate-fade-in">
            {error}
          </div>
        )}

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

        {modals}
      </div>
    </div>
  );
}
