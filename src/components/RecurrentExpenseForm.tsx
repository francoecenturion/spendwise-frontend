import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { RecurrentExpenseFormProps, RecurrentExpense, Category, Currency } from '../types';
import { categoryService, currencyService } from '../services/api';
import IconPicker from './IconPicker';
import CategoryPicker from './CategoryPicker';
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

const parseAmountFromDisplay = (display: string): number =>
  parseFloat(display.replace(/\./g, '').replace(',', '.')) || 0;

const numberToDisplay = (value: number): string => {
  if (!value) return '';
  return value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export default function RecurrentExpenseForm({ recurrentExpense, onSubmit, onCancel }: RecurrentExpenseFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [amountRaw, setAmountRaw] = useState<string>('');

  const [formData, setFormData] = useState<RecurrentExpense>({
    description: '',
    dayOfMonth: undefined,
    category: { name: '' },
    currency: { name: '', symbol: '' },
    enabled: true,
  });

  useEffect(() => { loadData(); }, []);

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
      const [categoriesRes, currenciesRes] = await Promise.all([
        categoryService.getAll({ enabled: true }, 0, 1000),
        currencyService.getAll({}, 0, 1000),
      ]);
      setCategories(categoriesRes.content);
      setCurrencies(currenciesRes.content);
      if (!recurrentExpense) {
        const defaultCurrency = currenciesRes.content.find(c => c.isDefault);
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
    if (name === 'currencyId') {
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
      if (value === '') {
        setFormData(prev => ({ ...prev, dayOfMonth: undefined }));
      } else {
        const day = Math.min(31, Math.max(1, parseInt(value) || 1));
        setFormData(prev => ({ ...prev, dayOfMonth: day }));
      }
    } else if (name === 'enabled') {
      setFormData(prev => ({ ...prev, enabled: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.category.id) { alert('Por favor seleccioná una categoría'); return; }
    if (!formData.currency?.id) { alert('Por favor seleccioná una moneda'); return; }
    const amount = parseAmountFromDisplay(amountRaw);
    if (amount <= 0) { alert('El monto debe ser mayor a 0'); return; }
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
          placeholder="Ej: Alquiler, Expensas, Netflix…"
        />
      </div>

      {/* Ícono */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Ícono <span className="text-stone-400 font-normal">(opcional)</span>
        </label>
        <IconPicker
          value={formData.icon || ''}
          onChange={icon => setFormData(prev => ({ ...prev, icon }))}
          type="category"
        />
        {formData.icon && (
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, icon: undefined }))}
            className="mt-1.5 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
          >
            Quitar ícono
          </button>
        )}
      </div>

      {/* Monto + Día */}
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
            Día <span className="text-stone-400 font-normal">opcional</span>
          </label>
          <input
            type="number"
            id="dayOfMonth"
            name="dayOfMonth"
            value={formData.dayOfMonth ?? ''}
            onChange={handleChange}
            className="input-field"
            min={1}
            max={31}
            placeholder="Ej: 10"
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
            const currentAmount = parseAmountFromDisplay(amountRaw);
            const isPesos = isPesosCurrency(c);
            setFormData(prev => ({
              ...prev,
              currency: c,
              amountInPesos: isPesos ? currentAmount : undefined,
              amountInDollars: isPesos ? undefined : currentAmount,
            }));
          }}
        />
      </div>

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

      {/* Activo (solo en edición) */}
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

      {/* Acciones */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="btn btn-primary flex-1"
          disabled={categories.length === 0 || currencies.length === 0}
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
