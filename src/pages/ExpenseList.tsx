import { useState, useEffect } from 'react';
import { expenseService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import ExpenseForm from '../components/ExpenseForm.tsx';
import { Expense, TableColumn } from '../types';

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00'); // Agregar hora para evitar problemas de zona horaria
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const columns: TableColumn<Expense>[] = [
    { 
      key: 'date', 
      label: 'Fecha',
      render: (value: string) => formatDate(value)
    },
    { 
      key: 'description', 
      label: 'Descripción',
      render: (value: string) => (
        <span className="font-medium text-stone-900">{value}</span>
      )
    },
    { 
      key: 'amountInPesos', 
      label: 'Monto (ARS)',
      render: (value: number) => (
        <span className="font-semibold text-green-700">{formatCurrency(value)}</span>
      )
    },
    { 
      key: 'amountInDollars', 
      label: 'Monto (USD)',
      render: (value: number | undefined) => (
        <span className="font-semibold text-blue-700">
          {value ? formatUSD(value) : 'N/A'}
        </span>
      )
    },
    { 
      key: 'category', 
      label: 'Categoría',
      render: (value: any) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {value?.name || 'Sin categoría'}
        </span>
      )
    },
    { 
      key: 'paymentMethod', 
      label: 'Método de Pago',
      render: (value: any) => (
        <span className="text-sm text-stone-600">{value?.name || 'N/A'}</span>
      )
    },
  ];

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await expenseService.getAll();
      // Ordenar por fecha descendente (más recientes primero)
      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setExpenses(sorted);
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
      setExpenses(expenses.filter(exp => exp.id !== expenseToDelete.id));
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
        const updated = await expenseService.update(selectedExpense.id, formData);
        setExpenses(expenses.map(exp => exp.id === selectedExpense.id ? updated : exp)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } else {
        const created = await expenseService.create(formData);
        setExpenses([created, ...expenses]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
      setIsModalOpen(false);
      setSelectedExpense(null);
    } catch (err) {
      console.error('Error saving expense:', err);
      alert('Error al guardar el gasto');
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amountInPesos, 0);
  const totalExpensesUSD = expenses.reduce((sum, exp) => sum + (exp.amountInDollars || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-stone-900 mb-2">Gastos</h1>
          <p className="text-stone-600">Registra y administra tus gastos diarios</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 animate-fade-in">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 animate-fade-in">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 mb-1">Total (ARS)</p>
                <p className="text-2xl font-bold text-stone-900">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 mb-1">Total (USD)</p>
                <p className="text-2xl font-bold text-blue-700">{formatUSD(totalExpensesUSD)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 mb-1">Total de Gastos</p>
                <p className="text-2xl font-bold text-stone-900">{expenses.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600 mb-1">Promedio por Gasto</p>
                <p className="text-2xl font-bold text-stone-900">
                  {expenses.length > 0 ? formatCurrency(totalExpenses / expenses.length) : formatCurrency(0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <div className="text-sm text-stone-600">
            Mostrando <span className="font-semibold text-stone-900">{expenses.length}</span> gastos
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
          <Table
            columns={columns}
            data={expenses}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedExpense ? 'Editar Gasto' : 'Registrar Gasto'}
        >
          <ExpenseForm
            expense={selectedExpense}
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
            <p className="text-stone-600">
              ¿Estás seguro de que deseas eliminar el gasto <span className="font-semibold">{expenseToDelete?.description}</span> de <span className="font-semibold">{expenseToDelete && formatCurrency(expenseToDelete.amountInPesos)}</span>?
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
