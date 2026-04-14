import { useState, useEffect, FormEvent } from 'react';
import { PersonalDebt, Currency } from '../types';
import { currencyService } from '../services/api';
import CurrencyPicker from './CurrencyPicker';

const formatAmountDisplay = (stripped: string): string => {
  const parts = stripped.split(',');
  const intFormatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.length > 1 ? `${intFormatted},${parts[1]}` : intFormatted;
};

const parseAmountFromDisplay = (display: string): number =>
  parseFloat(display.replace(/\./g, '').replace(',', '.')) || 0;

const numberToDisplay = (value?: number): string => {
  if (!value) return '';
  return value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

interface Props {
  item?: PersonalDebt | null;
  onSubmit: (data: PersonalDebt) => void;
  onCancel: () => void;
}

export default function PersonalDebtForm({ item, onSubmit, onCancel }: Props) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [amountRaw, setAmountRaw] = useState('');

  const [formData, setFormData] = useState<PersonalDebt>({
    description: '',
    amountInPesos: 0,
    inputAmount: 0,
    date: new Date().toISOString().split('T')[0],
    creditor: '',
    currency: { name: '', symbol: '' },
  });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (item) {
      const displayAmount = item.amountInDollars != null ? item.amountInDollars : (item.amountInPesos ?? 0);
      setFormData({
        ...item,
        date: item.date.split('T')[0],
        dueDate: item.dueDate ? item.dueDate.split('T')[0] : undefined,
        inputAmount: displayAmount,
        currency: item.currency ?? { name: '', symbol: '' },
      });
      setAmountRaw(numberToDisplay(displayAmount));
    }
  }, [item]);

  const loadData = async () => {
    try {
      setLoading(true);
      const currenciesResponse = await currencyService.getAll({}, 0, 1000);
      setCurrencies(currenciesResponse.content);
      if (!item) {
        const defaultCurrency = currenciesResponse.content.find(c => c.isDefault);
        if (defaultCurrency) setFormData(prev => ({ ...prev, currency: defaultCurrency }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const stripped = value.replace(/\./g, '').replace(/[^0-9,]/g, '');
    if ((stripped.match(/,/g) || []).length > 1) return;
    const formatted = formatAmountDisplay(stripped);
    setAmountRaw(formatted);
    setFormData(prev => ({ ...prev, inputAmount: parseAmountFromDisplay(formatted) }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.creditor?.trim()) {
      alert('Ingresá el nombre del acreedor');
      return;
    }
    if (!formData.currency?.id) {
      alert('Seleccioná una moneda');
      return;
    }
    if ((formData.inputAmount ?? 0) <= 0) {
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

      {/* Acreedor */}
      <div>
        <label htmlFor="creditor" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Acreedor
        </label>
        <input
          type="text"
          id="creditor"
          value={formData.creditor ?? ''}
          onChange={e => setFormData(prev => ({ ...prev, creditor: e.target.value }))}
          className="input-field"
          required
          placeholder="Ej: Juan Pérez, María García..."
        />
      </div>

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
          placeholder="Ej: Préstamo de dinero, anticipo..."
        />
      </div>

      {/* Monto + Moneda */}
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
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
            Moneda
          </label>
          <CurrencyPicker
            currencies={currencies}
            value={formData.currency?.id ? formData.currency : undefined}
            onChange={c => setFormData(prev => ({ ...prev, currency: c }))}
          />
        </div>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-4">
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
          />
        </div>
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Vencimiento <span className="text-stone-400 font-normal">opcional</span>
          </label>
          <input
            type="date"
            id="dueDate"
            value={formData.dueDate ?? ''}
            onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value || undefined }))}
            className="input-field"
          />
        </div>
      </div>

      {/* Estado cancelado (solo edición) */}
      {item && (
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.cancelled ?? false}
              onChange={e => setFormData(prev => ({ ...prev, cancelled: e.target.checked }))}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600"
            />
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Deuda cancelada</span>
          </label>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button type="submit" className="btn btn-primary flex-1">
          {item ? 'Actualizar' : 'Registrar'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
