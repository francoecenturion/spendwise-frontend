import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { ChevronLeft, Calendar } from 'lucide-react';
import { IncomeFormProps, Income, Category, Currency, CategoryType } from '../types';
import { categoryService, currencyService } from '../services/api';
import CategoryPicker from './CategoryPicker';

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

const formatDateDisplay = (iso: string): string => {
  if (!iso) return 'Seleccionar fecha';
  if (iso === new Date().toLocaleDateString('en-CA')) return 'Hoy';
  const date = new Date(iso + 'T00:00:00');
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
};

type Step = 1 | 2;

export default function IncomeForm({ income, onSubmit, onCancel }: IncomeFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [amountRaw, setAmountRaw] = useState<string>('');
  const [step, setStep] = useState<Step>(1);
  const dateInputRef = useRef<HTMLInputElement>(null);

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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCurrencySelect = (c: Currency) => {
    const currentAmount = parseAmountFromDisplay(amountRaw);
    setFormData(prev => ({ ...prev, currency: c, inputAmount: currentAmount }));
  };

  const canGoStep2 = (formData.inputAmount ?? 0) > 0 && !!formData.currency?.id;
  const hasRequiredData = categories.length > 0 && currencies.length > 0;
  const canSubmit = hasRequiredData
    && !!formData.source.id
    && !!formData.description.trim()
    && !!formData.currency?.id
    && (formData.inputAmount ?? 0) > 0;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(formData);
  };

  const currencySymbol = formData.currency?.symbol || '$';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-stone-100" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header: back button + step indicator */}
      <div className="flex items-center justify-between">
        <div className="w-8">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((step - 1) as Step)}
              aria-label="Atrás"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {([1, 2] as Step[]).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              aria-label={`Paso ${s}`}
              className={`h-2 rounded-full transition-all duration-200 ${
                s === step ? 'w-8 bg-teal-700 dark:bg-teal-600' : 'w-2 bg-stone-200 dark:bg-stone-700'
              }`}
            />
          ))}
        </div>
        <div className="w-8" />
      </div>

      {/* ── Paso 1: Monto ─────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col items-center py-4">
            <div className="flex items-center justify-center">
              <span className="text-4xl font-bold text-stone-400 dark:text-stone-500 mr-1 select-none">
                {currencySymbol}
              </span>
              <input
                type="text"
                inputMode="decimal"
                id="inputAmount"
                name="inputAmount"
                value={amountRaw}
                onChange={e => handleAmountChange(e.target.value)}
                placeholder="0"
                autoFocus
                size={Math.max(amountRaw.length, 1)}
                className="text-5xl font-bold text-center bg-transparent border-none outline-none text-stone-900 dark:text-stone-50 placeholder:text-stone-300 dark:placeholder:text-stone-600 min-w-[1ch]"
              />
            </div>

            {currencies.length > 0 && (
              <div className="mt-5 inline-flex rounded-full bg-stone-100 dark:bg-stone-800 p-1 gap-0.5">
                {currencies.map(c => {
                  const active = formData.currency?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleCurrencySelect(c)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 ${
                        active
                          ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-sm'
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                      }`}
                    >
                      {c.symbol}
                    </button>
                  );
                })}
              </div>
            )}
            {currencies.length === 0 && (
              <p className="text-sm text-stone-400 dark:text-stone-500 mt-3">⚠️ No hay monedas disponibles. Creá una primero.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!canGoStep2}
            className="btn btn-primary w-full"
          >
            Continuar
          </button>
        </div>
      )}

      {/* ── Paso 2: Detalle ───────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-col items-center">
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Fecha
            </label>
            <button
              type="button"
              onClick={() => {
                const el = dateInputRef.current;
                if (!el) return;
                if (typeof el.showPicker === 'function') {
                  try { el.showPicker(); return; } catch { /* fall through */ }
                }
                el.focus();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 dark:bg-stone-800 text-sm font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              <Calendar size={16} />
              {formatDateDisplay(formData.date)}
            </button>
            <input
              ref={dateInputRef}
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              max={new Date().toLocaleDateString('en-CA')}
              className="sr-only"
              tabIndex={-1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3 text-center">
              Fuente
            </label>
            <CategoryPicker
              categories={categories}
              value={formData.source.id ? formData.source : undefined}
              onChange={cat => setFormData(prev => ({ ...prev, source: cat }))}
              emptyMessage="⚠️ No hay categorías activas. Creá una primero."
            />
          </div>

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
              placeholder="Ej: Sueldo, Freelance, Alquiler…"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={!canSubmit}
            >
              {income ? 'Guardar Cambios' : 'Crear Ingreso'}
            </button>
            <button type="button" onClick={onCancel} className="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
