import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { RecurrentExpenseFormProps, RecurrentExpense, Category, PaymentMethod, Currency } from '../types';
import { categoryService, paymentMethodService, currencyService } from '../services/api';

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

export default function RecurrentExpenseForm({ recurrentExpense, onSubmit, onCancel }: RecurrentExpenseFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [amountRaw, setAmountRaw] = useState<string>('');

  const [formData, setFormData] = useState<RecurrentExpense>({
    description: '',
    dayOfMonth: 1,
    category: { name: '' },
    paymentMethod: { name: '', paymentMethodType: '' },
    currency: { name: '', symbol: '' },
    enabled: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (recurrentExpense) {
      const isPesos = isPesosCurrency(recurrentExpense.currency);
      const displayAmount = isPesos
        ? (recurrentExpense.amountInPesos ?? 0)
        : (recurrentExpense.amountInDollars ?? 0);
      setFormData({
        ...recurrentExpense,
        currency: recurrentExpense.currency ?? { name: '', symbol: '' },
      });
      setAmountRaw(numberToDisplay(displayAmount));
    }
  }, [recurrentExpense]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, paymentMethodsRes, currenciesRes] = await Promise.all([
        categoryService.getAll({ enabled: true }, 0, 1000),
        paymentMethodService.getAll({ enabled: true }, 0, 1000),
        currencyService.getAll({}, 0, 1000),
      ]);
      setCategories(categoriesRes.content);
      setPaymentMethods(paymentMethodsRes.content);
      setCurrencies(currenciesRes.content);
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
    const parsed = parseAmountFromDisplay(formatted);
    const isPesos = isPesosCurrency(formData.currency);
    setFormData(prev => ({
      ...prev,
      amountInPesos: isPesos ? parsed : undefined,
      amountInDollars: isPesos ? undefined : parsed,
    }));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'categoryId') {
      const selected = categories.find(c => c.id === Number(value));
      if (selected) setFormData(prev => ({ ...prev, category: selected }));
    } else if (name === 'paymentMethodId') {
      const selected = paymentMethods.find(pm => pm.id === Number(value));
      if (selected) setFormData(prev => ({ ...prev, paymentMethod: selected }));
    } else if (name === 'currencyId') {
      const selected = currencies.find(c => c.id === Number(value));
      if (selected) {
        const currentAmount = parseAmountFromDisplay(amountRaw);
        const isPesos = isPesosCurrency(selected);
        setFormData(prev => ({
          ...prev,
          currency: selected,
          amountInPesos: isPesos ? currentAmount : undefined,
          amountInDollars: isPesos ? undefined : currentAmount,
        }));
      }
    } else if (name === 'amount') {
      handleAmountChange(value);
    } else if (name === 'dayOfMonth') {
      const day = Math.min(31, Math.max(1, parseInt(value) || 1));
      setFormData(prev => ({ ...prev, dayOfMonth: day }));
    } else if (name === 'enabled') {
      setFormData(prev => ({ ...prev, enabled: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.category.id) {
      alert('Por favor seleccioná una categoría');
      return;
    }
    if (!formData.paymentMethod.id) {
      alert('Por favor seleccioná un método de pago');
      return;
    }
    if (!formData.currency?.id) {
      alert('Por favor seleccioná una moneda');
      return;
    }
    const amount = parseAmountFromDisplay(amountRaw);
    if (amount <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }
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
          placeholder="Ej: Alquiler, Expensas, Netflix, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Monto
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400 text-sm font-medium select-none">
              {currencySymbol}
            </span>
            <input
              type="text"
              inputMode="decimal"
              id="amount"
              name="amount"
              value={amountRaw}
              onChange={handleChange}
              className={`input-field ${symbolWidth}`}
              required
              placeholder="0,00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="dayOfMonth" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Día de vencimiento
          </label>
          <input
            type="number"
            id="dayOfMonth"
            name="dayOfMonth"
            value={formData.dayOfMonth}
            onChange={handleChange}
            className="input-field"
            required
            min={1}
            max={31}
            placeholder="Ej: 10"
          />
        </div>
      </div>

      <div>
        <label htmlFor="currencyId" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Moneda
        </label>
        <select
          id="currencyId"
          name="currencyId"
          value={formData.currency?.id || ''}
          onChange={handleChange}
          className="input-field"
          required
        >
          <option value="">Seleccioná una moneda</option>
          {currencies.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Categoría
        </label>
        <select
          id="categoryId"
          name="categoryId"
          value={formData.category.id || ''}
          onChange={handleChange}
          className="input-field"
          required
        >
          <option value="">Seleccioná una categoría</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="paymentMethodId" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Método de Pago
        </label>
        <select
          id="paymentMethodId"
          name="paymentMethodId"
          value={formData.paymentMethod.id || ''}
          onChange={handleChange}
          className="input-field"
          required
        >
          <option value="">Seleccioná un método de pago</option>
          {paymentMethods.map(pm => (
            <option key={pm.id} value={pm.id}>{pm.name}</option>
          ))}
        </select>
      </div>

      {recurrentExpense && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="enabled"
            name="enabled"
            checked={formData.enabled ?? true}
            onChange={handleChange}
            className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 accent-stone-900 dark:accent-stone-100"
          />
          <label htmlFor="enabled" className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Activo
          </label>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="btn btn-primary flex-1"
          disabled={categories.length === 0 || paymentMethods.length === 0 || currencies.length === 0}
        >
          {recurrentExpense ? 'Actualizar' : 'Crear'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
