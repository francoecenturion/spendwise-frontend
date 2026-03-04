import { useState, useEffect, FormEvent } from 'react';
import { BudgetFormProps, Budget, RecurrentExpense } from '../types';
import { recurrentExpenseService } from '../services/api';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const formatCurrency = (amount?: number) =>
  amount != null
    ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount)
    : null;

const formatUSD = (amount?: number) =>
  amount != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount)
    : null;

export default function BudgetForm({ budget, onSubmit, onCancel }: BudgetFormProps) {
  const now = new Date();
  const [allRecurrentExpenses, setAllRecurrentExpenses] = useState<RecurrentExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<Budget>({
    description: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    enabled: true,
    recurrentExpenses: [],
  });

  useEffect(() => {
    loadRecurrentExpenses();
  }, []);

  useEffect(() => {
    if (budget) {
      setFormData({
        ...budget,
        recurrentExpenses: budget.recurrentExpenses ?? [],
      });
    }
  }, [budget]);

  const loadRecurrentExpenses = async () => {
    try {
      setLoading(true);
      const res = await recurrentExpenseService.getAll({ enabled: true }, 0, 1000);
      setAllRecurrentExpenses(res.content);
    } catch (err) {
      console.error('Error loading recurrent expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (re: RecurrentExpense) =>
    formData.recurrentExpenses.some(r => r.id === re.id);

  const toggleExpense = (re: RecurrentExpense) => {
    setFormData(prev => ({
      ...prev,
      recurrentExpenses: isSelected(re)
        ? prev.recurrentExpenses.filter(r => r.id !== re.id)
        : [...prev.recurrentExpenses, re],
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      alert('Ingresá una descripción');
      return;
    }
    if (formData.recurrentExpenses.length === 0) {
      alert('Seleccioná al menos un gasto recurrente');
      return;
    }
    onSubmit(formData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-stone-100" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Descripción
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="input-field"
          required
          placeholder="Ej: Presupuesto Enero"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Mes
          </label>
          <select
            value={formData.month}
            onChange={e => setFormData(prev => ({ ...prev, month: Number(e.target.value) }))}
            className="input-field"
            required
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Año
          </label>
          <input
            type="number"
            value={formData.year}
            onChange={e => setFormData(prev => ({ ...prev, year: Number(e.target.value) }))}
            className="input-field"
            required
            min={2020}
            max={2099}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Gastos Recurrentes{' '}
          <span className="text-stone-400 font-normal">
            ({formData.recurrentExpenses.length} seleccionados)
          </span>
        </label>

        {allRecurrentExpenses.length === 0 ? (
          <p className="text-sm text-stone-400 dark:text-stone-500 py-4 text-center">
            No hay gastos recurrentes activos. Creá uno primero.
          </p>
        ) : (
          <div className="border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
            {allRecurrentExpenses.map(re => {
              const selected = isSelected(re);
              const arsStr = formatCurrency(re.amountInPesos);
              const usdStr = formatUSD(re.amountInDollars);
              return (
                <label
                  key={re.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    selected
                      ? 'bg-stone-50 dark:bg-stone-800'
                      : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleExpense(re)}
                    className="w-4 h-4 rounded accent-stone-900 dark:accent-stone-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-50 truncate">
                      {re.description}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">
                      Día {re.dayOfMonth} · {re.category?.name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {arsStr && <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">{arsStr}</p>}
                    {usdStr && <p className="text-xs text-blue-600 dark:text-blue-400">{usdStr}</p>}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {budget && (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.enabled ?? true}
            onChange={e => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
            className="w-4 h-4 rounded accent-stone-900 dark:accent-stone-100"
          />
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Activo</span>
        </label>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn btn-primary flex-1">
          {budget ? 'Actualizar' : 'Crear'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
