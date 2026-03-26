import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { ExpenseFormProps, Expense, Category, PaymentMethod, Currency, CategoryType } from '../types';
import { categoryService, paymentMethodService, currencyService } from '../services/api';
import CategoryPicker from './CategoryPicker';
import PaymentMethodPicker from './PaymentMethodPicker';
import CurrencyPicker from './CurrencyPicker';

const isPesosCurrency = (currency?: Currency | null): boolean => {
  if (!currency?.name) return true;
  const name = currency.name.toLowerCase();
  return name.includes('peso') || name.includes('ars') || name.includes('argentino');
};

const formatAmountDisplay = (stripped: string): string => {
  const parts = stripped.split(',');
  const intFormatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.length > 1 ? `${intFormatted},${parts[1]}` : intFormatted;
};

const parseAmountFromDisplay = (display: string): number => {
  return parseFloat(display.replace(/\./g, '').replace(',', '.')) || 0;
};

const numberToDisplay = (value: number): string => {
  if (!value) return '';
  return value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export default function ExpenseForm({ expense, onSubmit, onCancel }: ExpenseFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [amountRaw, setAmountRaw] = useState<string>('');

  const [formData, setFormData] = useState<Expense>({
    description: '',
    inputAmount: 0,
    amountInPesos: 0,
    date: new Date().toISOString().split('T')[0],
    category: { name: '' },
    paymentMethod: { name: '', paymentMethodType: '' },
    currency: { name: '', symbol: '' },
    microExpense: false,
  });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (expense) {
      const isPesos = isPesosCurrency(expense.currency);
      const displayAmount = isPesos
        ? expense.amountInPesos
        : (expense.amountInDollars ?? expense.amountInPesos);
      setFormData({
        ...expense,
        date: expense.date.split('T')[0],
        inputAmount: displayAmount,
        currency: expense.currency ?? { name: '', symbol: '' },
        microExpense: expense.microExpense ?? false,
      });
      setAmountRaw(numberToDisplay(displayAmount));
    }
  }, [expense]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesResponse, paymentMethodsResponse, currenciesResponse] = await Promise.all([
        categoryService.getAll({ enabled: true, type: CategoryType.EXPENSE }, 0, 1000),
        paymentMethodService.getAll({ enabled: true }, 0, 1000),
        currencyService.getAll({}, 0, 1000),
      ]);
      setCategories(categoriesResponse.content);
      setPaymentMethods(paymentMethodsResponse.content);
      setCurrencies(currenciesResponse.content);
      if (!expense) {
        const defaultCurrency = currenciesResponse.content.find(c => c.isDefault);
        if (defaultCurrency) setFormData(prev => ({ ...prev, currency: defaultCurrency }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error al cargar los datos necesarios');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const stripped = value.replace(/\./g, '').replace(/[^0-9,]/g, '');
    const commaCount = (stripped.match(/,/g) || []).length;
    if (commaCount > 1) return;
    const formatted = formatAmountDisplay(stripped);
    setAmountRaw(formatted);
    setFormData(prev => ({ ...prev, inputAmount: parseAmountFromDisplay(formatted) }));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'currencyId') {
      const selected = currencies.find(c => c.id === Number(value));
      if (selected) setFormData(prev => ({ ...prev, currency: selected }));
    } else if (name === 'inputAmount') {
      handleAmountChange(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.category.id) { alert('Por favor seleccioná una categoría'); return; }
    if (!formData.paymentMethod.id) { alert('Por favor seleccioná un método de pago'); return; }
    if (!formData.currency?.id) { alert('Por favor seleccioná una moneda'); return; }
    if ((formData.inputAmount ?? 0) <= 0) { alert('El monto debe ser mayor a 0'); return; }
    onSubmit(formData);
  };

  const currencySymbol = formData.currency?.symbol || '$';
  const symbolWidth = currencySymbol.length > 1 ? 'pl-10' : 'pl-7';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-stone-100" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Descripción */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Descripción
        </label>
        <input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="input-field"
          required
          placeholder="Ej: Supermercado, Almuerzo, Netflix…"
        />
      </div>

      {/* Monto + Fecha */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="inputAmount" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Monto
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400 text-sm font-medium select-none">
              {currencySymbol}
            </span>
            <input
              type="text"
              inputMode="decimal"
              id="inputAmount"
              name="inputAmount"
              value={amountRaw}
              onChange={handleChange}
              className={`input-field ${symbolWidth}`}
              required
              placeholder="0,00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Fecha
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="input-field"
            required
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* Moneda */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
          Moneda
        </label>
        <CurrencyPicker
          currencies={currencies}
          value={formData.currency?.id ? formData.currency : undefined}
          onChange={c => {
            setFormData(prev => ({
              ...prev,
              currency: c,
              inputAmount: parseAmountFromDisplay(amountRaw),
            }));
          }}
          emptyMessage="⚠️ No hay monedas disponibles. Creá una primero."
        />
      </div>

      {formData.currency?.id && (
        <p className="text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2">
          {isPesosCurrency(formData.currency)
            ? '💡 El equivalente en dólares se calcula automáticamente usando el tipo de cambio del día.'
            : '💡 El equivalente en pesos se calcula automáticamente.'}
        </p>
      )}

      {/* Categoría */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
          Categoría
        </label>
        <CategoryPicker
          categories={categories}
          value={formData.category.id ? formData.category : undefined}
          onChange={cat => setFormData(prev => ({ ...prev, category: cat }))}
        />
      </div>

      {/* Método de pago */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
          Método de Pago
        </label>
        <PaymentMethodPicker
          paymentMethods={paymentMethods}
          value={formData.paymentMethod.id ? formData.paymentMethod : undefined}
          onChange={pm => { if (pm) setFormData(prev => ({ ...prev, paymentMethod: pm })); }}
        />
      </div>

      {/* Gasto hormiga */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="microExpense"
          checked={formData.microExpense ?? false}
          onChange={e => setFormData(prev => ({ ...prev, microExpense: e.target.checked }))}
          className="w-4 h-4 text-stone-900 rounded border-stone-300 dark:border-stone-600"
        />
        <label htmlFor="microExpense" className="text-sm font-medium text-stone-700 dark:text-stone-300">
          Gasto hormiga
        </label>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="btn btn-primary flex-1"
          disabled={categories.length === 0 || paymentMethods.length === 0 || currencies.length === 0}
        >
          {expense ? 'Actualizar' : 'Crear'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
