import { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import { mailImportService } from '../services/api';
import { MailImport, MailImportStatus } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';
import MailImportConfirmModal from '../components/MailImportConfirmModal';
import GmailConnectionPanel from '../components/GmailConnectionPanel';

const STATUS_LABELS: Record<MailImportStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  IGNORED: 'Ignorado',
  PARSE_FAILED: 'Sin parsear',
};

const STATUS_COLORS: Record<MailImportStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  IGNORED: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  PARSE_FAILED: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
};

type FilterTab = 'ALL' | MailImportStatus;

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'Todos' },
  { key: 'PENDING', label: 'Pendientes' },
  { key: 'CONFIRMED', label: 'Confirmados' },
  { key: 'IGNORED', label: 'Ignorados' },
];

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString + (dateString.includes('T') ? '' : 'T00:00:00'));
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

export default function MailImportPage() {
  const isMobile = useIsMobile();

  const [items, setItems] = useState<MailImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [activeTab, setActiveTab] = useState<FilterTab>('PENDING');

  const [confirmItem, setConfirmItem] = useState<MailImport | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);


  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

  useEffect(() => {
    loadItems();
  }, [currentPage, activeTab]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const filters = activeTab !== 'ALL' ? { status: activeTab as MailImportStatus } : {};
      const response = await mailImportService.getAll(filters, currentPage, 20);
      setItems(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch {
      setError('Error al cargar las importaciones.');
    } finally {
      setLoading(false);
    }
  };

  const handleIgnore = async (item: MailImport) => {
    if (!item.id) return;
    try {
      await mailImportService.ignore(item.id);
      loadItems();
    } catch {
      alert('Error al ignorar el registro.');
    }
  };

  const openConfirm = (item: MailImport) => {
    setConfirmItem(item);
    setConfirmOpen(true);
  };

  const StatusBadge = ({ status }: { status: MailImportStatus }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );

  const DebtBadge = () => (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
      Tarjeta crédito
    </span>
  );

  const FilterTabs = () => (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === tab.key
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const Pagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 dark:border-stone-700">
        <span className="text-sm text-stone-500 dark:text-stone-400">
          {totalElements} importaciones
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => p - 1)}
            disabled={currentPage === 0}
            className="btn btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="flex items-center text-sm text-stone-600 dark:text-stone-400">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={currentPage >= totalPages - 1}
            className="btn btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    );
  };

  // ── Mobile view ─────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="animate-fade-in pb-6">
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2"><Mail size={22} className="text-teal-700 dark:text-teal-400" />Importaciones</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">Mails recibidos con gastos</p>
        </div>

        <div className="px-4 pb-3">
          <GmailConnectionPanel />
        </div>

        <div className="px-4 pb-3">
          <FilterTabs />
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="mx-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-12 px-4">
            <p className="text-stone-400 dark:text-stone-500">No hay importaciones para esta categoría.</p>
          </div>
        )}

        <div className="px-4 space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              className="card animate-fade-in"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-900 dark:text-stone-50 truncate">
                    {item.parsedMerchant || item.senderEntity || item.fromAddress || 'Sin remitente'}
                  </p>
                  {item.subject && (
                    <p className="text-xs text-stone-400 dark:text-stone-500 truncate mt-0.5">{item.subject}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={item.status} />
                  {item.parsedIsDebt && <DebtBadge />}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-stone-500 dark:text-stone-400">
                  {formatDate(item.parsedDate || item.creationDate)}
                </span>
                {item.parsedAmount != null && (
                  <span className="font-semibold text-stone-900 dark:text-stone-50">
                    {item.parsedCurrencySymbol} {item.parsedAmount.toLocaleString('es-AR')}
                  </span>
                )}
              </div>

              {item.status === 'PENDING' && (
                <div className="flex gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <button
                    onClick={() => openConfirm(item)}
                    className="btn btn-primary flex-1 text-sm py-2"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => handleIgnore(item)}
                    className="btn btn-secondary flex-1 text-sm py-2"
                  >
                    Ignorar
                  </button>
                </div>
              )}

              {item.status === 'CONFIRMED' && item.expense && (
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-green-600 dark:text-green-400">
                  Gasto #{item.expense.id} creado — {item.expense.category?.name}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-4 mt-4">
          <Pagination />
        </div>

        <MailImportConfirmModal
          mailImport={confirmItem}
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirmed={loadItems}
        />
      </div>
    );
  }

  // ── Desktop view ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2 flex items-center gap-3"><Mail size={36} className="text-teal-700 dark:text-teal-400" />Importaciones de mail</h1>
          <p className="text-stone-600 dark:text-stone-400">Gastos detectados desde tu Gmail</p>
        </div>
        <span className="text-sm text-stone-400 dark:text-stone-500">{totalElements} registros</span>
      </div>

      <div className="mb-4">
        <GmailConnectionPanel />
      </div>

      <div className="mb-4">
        <FilterTabs />
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-stone-400 dark:text-stone-500">
            No hay importaciones para esta categoría.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Entidad</th>
                  <th>Asunto</th>
                  <th>Comercio</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap text-sm text-stone-500 dark:text-stone-400">
                      {formatDate(item.parsedDate || item.creationDate)}
                    </td>
                    <td className="max-w-[160px]">
                      <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-50">
                        {item.senderEntity || item.fromAddress || '-'}
                      </p>
                    </td>
                    <td className="max-w-[200px]">
                      <p className="truncate text-sm text-stone-500 dark:text-stone-400" title={item.subject}>
                        {item.subject || '-'}
                      </p>
                    </td>
                    <td className="text-sm font-medium text-stone-900 dark:text-stone-50">
                      {item.parsedMerchant || '-'}
                    </td>
                    <td className="whitespace-nowrap text-sm font-semibold text-stone-900 dark:text-stone-50">
                      {item.parsedAmount != null
                        ? `${item.parsedCurrencySymbol ?? ''} ${item.parsedAmount.toLocaleString('es-AR')}`
                        : '-'}
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={item.status} />
                        {item.parsedIsDebt && <DebtBadge />}
                      </div>
                    </td>
                    <td>
                      {item.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openConfirm(item)}
                            className="btn btn-primary text-xs px-3 py-1.5"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => handleIgnore(item)}
                            className="btn btn-secondary text-xs px-3 py-1.5"
                          >
                            Ignorar
                          </button>
                        </div>
                      )}
                      {item.status === 'CONFIRMED' && item.expense && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Gasto #{item.expense.id}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination />
      </div>

      <MailImportConfirmModal
        mailImport={confirmItem}
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirmed={loadItems}
      />
      </div>
    </div>
  );
}
