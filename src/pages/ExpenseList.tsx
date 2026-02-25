import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { expenseService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import ExpenseForm from '../components/ExpenseForm.tsx';
import { Expense, TableColumn } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount);

const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);

const formatDate = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

export default function ExpenseList() {
  const isMobile = useIsMobile();
  const location = useLocation();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Open create modal when navigated here with ?new=1
  useEffect(() => {
    if (new URLSearchParams(location.search).get('new') === '1') {
      setSelectedExpense(null);
      setIsModalOpen(true);
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search]);

  useEffect(() => {
    loadExpenses();
  }, [currentPage]);

  const loadExpenses = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await expenseService.getAll({}, currentPage, 20);
      setExpenses(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err) {
      setError('Error al cargar los gastos. Verifica que el backend esté corriendo.');
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (): void => {
    setSelectedExpense(null);
    setIsModalOpen(true);
  };

  const handleEdit = (expense: Expense): void => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const handleDelete = (expense: Expense): void => {
    setExpenseToDelete(expense);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!expenseToDelete?.id) return;
    try {
      await expenseService.delete(expenseToDelete.id);
      loadExpenses();
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert('Error al eliminar el gasto');
    }
  };

  const handleSubmit = async (formData: Expense): Promise<void> => {
    try {
      if (selectedExpense?.id) {
        await expenseService.update(selectedExpense.id, formData);
      } else {
        await expenseService.create(formData);
      }
      loadExpenses();
      setIsModalOpen(false);
      setSelectedExpense(null);
    } catch (err) {
      console.error('Error saving expense:', err);
      alert('Error al guardar el gasto');
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amountInPesos, 0);
  const totalExpensesUSD = expenses.reduce((sum, exp) => sum + (exp.amountInDollars || 0), 0);

  const modals = (
    <>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedExpense ? 'Editar Gasto' : 'Registrar Gasto'}>
        <ExpenseForm expense={selectedExpense} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} />
      </Modal>
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Eliminación">
        <div className="space-y-4">
          <p className="text-stone-600 dark:text-stone-400">
            ¿Estás seguro de que deseas eliminar el gasto{' '}
            <span className="font-semibold">{expenseToDelete?.description}</span>?
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
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Gastos</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{totalElements} registros</p>
          </div>
          <button
            onClick={handleCreate}
            className="w-9 h-9 bg-stone-900 dark:bg-stone-100 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-white dark:text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Summary strip */}
        <div className="mx-4 mb-3 bg-white dark:bg-stone-900 rounded-xl px-4 py-3 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400">Total ARS</p>
            <p className="font-bold text-stone-900 dark:text-stone-50">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-500 dark:text-stone-400">Total USD</p>
            <p className="font-semibold text-blue-600">{formatUSD(totalExpensesUSD)}</p>
          </div>
        </div>

        {error && (
          <div className="mx-4 mb-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* List */}
        <div className="bg-white dark:bg-stone-900 border-t border-b border-stone-200 dark:border-stone-800">
          {expenses.length === 0 ? (
            <p className="text-center text-stone-400 dark:text-stone-500 py-12 text-sm">Sin gastos registrados</p>
          ) : (
            expenses.map((expense, index) => (
              <div
                key={expense.id}
                className={`flex items-start gap-3 px-4 py-3.5 ${index < expenses.length - 1 ? 'border-b border-stone-100 dark:border-stone-800' : ''}`}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-stone-900 dark:text-stone-50 truncate">{expense.description}</p>
                    <p className="font-semibold text-red-600 flex-shrink-0 text-sm">{formatCurrency(expense.amountInPesos)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-stone-400 dark:text-stone-500 flex-shrink-0">{formatDate(expense.date)}</span>
                      {expense.category?.name && (
                        <span className="text-xs bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 px-1.5 py-0.5 rounded truncate max-w-[100px]">
                          {expense.category.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {expense.amountInDollars != null && (
                        <span className="text-xs text-stone-400 dark:text-stone-500 mr-1">{formatUSD(expense.amountInDollars)}</span>
                      )}
                      <button onClick={() => handleEdit(expense)} className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(expense)} className="p-1.5 text-stone-400 hover:text-red-500 transition-colors">
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

  // ── DESKTOP VIEW ───────────────────────────────────────────────────────────
  const columns: TableColumn<Expense>[] = [
    { key: 'date', label: 'Fecha', render: (value: string) => formatDate(value) },
    {
      key: 'description', label: 'Descripción',
      render: (value: string) => <span className="font-medium text-stone-900 dark:text-stone-50">{value}</span>,
    },
    {
      key: 'amountInPesos', label: 'Monto (ARS)',
      render: (value: number) => <span className="font-semibold text-green-700">{formatCurrency(value)}</span>,
    },
    {
      key: 'amountInDollars', label: 'Monto (USD)',
      render: (value: number | undefined) => (
        <span className="font-semibold text-blue-700">{value ? formatUSD(value) : 'N/A'}</span>
      ),
    },
    {
      key: 'category', label: 'Categoría',
      render: (value: any) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {value?.name || 'Sin categoría'}
        </span>
      ),
    },
    {
      key: 'paymentMethod', label: 'Método de Pago',
      render: (value: any) => <span className="text-sm text-stone-600 dark:text-stone-400">{value?.name || 'N/A'}</span>,
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
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2">Gastos</h1>
          <p className="text-stone-600 dark:text-stone-400">Registra y administra tus gastos diarios</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-6 animate-fade-in">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Total (ARS)</p>
            <p className="text-2xl font-bold text-stone-900 dark:text-stone-50">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Total (USD)</p>
            <p className="text-2xl font-bold text-blue-700">{formatUSD(totalExpensesUSD)}</p>
          </div>
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Total de Gastos</p>
            <p className="text-2xl font-bold text-stone-900 dark:text-stone-50">{totalElements}</p>
          </div>
          <div className="bg-white dark:bg-stone-900 rounded-xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">Promedio por Gasto</p>
            <p className="text-2xl font-bold text-stone-900 dark:text-stone-50">
              {expenses.length > 0 ? formatCurrency(totalExpenses / expenses.length) : formatCurrency(0)}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            Mostrando <span className="font-semibold text-stone-900 dark:text-stone-50">{expenses.length}</span> de{' '}
            <span className="font-semibold">{totalElements}</span> gastos
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
          <Table columns={columns} data={expenses} onEdit={handleEdit} onDelete={handleDelete} />
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
