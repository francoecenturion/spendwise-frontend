import { useState, useEffect, FormEvent } from 'react';
import { IncomeFormProps, Income, Category, Currency, CategoryType } from '../types';
import { categoryService, currencyService } from '../services/api';
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

export default function IncomeForm({ income, onSubmit, onCancel }: IncomeFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [amountRaw, setAmountRaw] = useState<string>('');

  const [formData, setFormData] = useState<Income>({
    description: '',
    amountInPesos: 0,
    inputAmount: 0,
    date: new Date().toLocaleDateString('en-CA'),
    source: { name: '' },
    currency: { name: '', symbol: '' },
  });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (income) {
      const isPesos = isPesosCurrency(income.currency);
      const displayAmount = isPesos
        ? income.amountInPesos
        : (income.amountInDollars ?? income.amountInPesos);
      setFormData({
        ...income,
        date: income.date.split('T')[0],
        inputAmount: displayAmount,
        currency: income.currency ?? { name: '', symbol: '' },
      });
      setAmountRaw(numberToDisplay(displayAmount));
    }
  }, [income]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, currenciesRes] = await Promise.all([
        categoryService.getAll({ enabled: true, type: CategoryType.INCOME }, 0, 1000),
        currencyService.getAll({}, 0, 1000),
      ]);
      setCategories(categoriesRes.content);
      setCurrencies(currenciesRes.content);
      if (!income) {
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
      inputAmount: parsed,
      amountInPesos: isPesos ? parsed : prev.amountInPesos,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.source.id) { alert('Por favor seleccioná una fuente de ingreso'); return; }
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
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="input-field"
          required
          placeholder="Ej: Sueldo, Freelance, Alquiler…"
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
              value={amountRaw}
              onChange={e => handleAmountChange(e.target.value)}
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
            value={formData.date}
            onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="input-field"
            required
            max={new Date().toLocaleDateString('en-CA')}
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
            setFormData(prev => ({
              ...prev,
              currency: c,
              inputAmount: currentAmount,
            }));
          }}
        />
      </div>

      {/* Fuente (categoría) */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
          Fuente
        </label>
        <CategoryPicker
          categories={categories}
          value={formData.source.id ? formData.source : undefined}
          onChange={cat => setFormData(prev => ({ ...prev, source: cat }))}
          emptyMessage="⚠️ No hay categorías activas. Creá una primero."
        />
      </div>

      {/* Acciones */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="btn btn-primary flex-1"
          disabled={categories.length === 0 || currencies.length === 0}
        >
          {income ? 'Guardar Cambios' : 'Crear Ingreso'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
