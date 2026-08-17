import { useState, useEffect, FormEvent } from 'react';
import { CardExpense, PaymentMethod, Currency } from '../types';
import { paymentMethodService, currencyService } from '../services/api';
import CurrencyPicker from './CurrencyPicker';
import PaymentMethodWithEntityPicker from './PaymentMethodWithEntityPicker';

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
  item?: CardExpense | null;
  onSubmit: (data: CardExpense) => void;
  onCancel: () => void;
}

export default function CardExpenseForm({ item, onSubmit, onCancel }: Props) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [amountRaw, setAmountRaw] = useState('');

  const [formData, setFormData] = useState<CardExpense>({
    description: '',
    amountInPesos: 0,
    inputAmount: 0,
    date: new Date().toLocaleDateString('en-CA'),
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
      const [pmResponse, currenciesResponse] = await Promise.all([
        paymentMethodService.getAll({ enabled: true }, 0, 1000),
        currencyService.getAll({}, 0, 1000),
      ]);
      // Only show credit and debit cards (no cash, no transfer)
      const cardPms = pmResponse.content.filter(
        pm => pm.paymentMethodType === 'CREDIT_CARD' || pm.paymentMethodType === 'DEBIT_CARD'
      );
      setPaymentMethods(cardPms);
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
    if (!formData.paymentMethod?.id) {
      alert('Seleccioná un método de pago');
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
          placeholder="Ej: Cuota Visa, Netflix, Supermercado..."
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

      {/* Método de pago (obligatorio, solo tarjetas) */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
          Tarjeta *
        </label>
        {paymentMethods.length === 0 ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            ⚠️ No hay tarjetas de crédito/débito activas. Cargá una en Métodos de Pago.
          </p>
        ) : (
          <PaymentMethodWithEntityPicker
            paymentMethods={paymentMethods}
            value={formData.paymentMethod?.id ? formData.paymentMethod : undefined}
            onChange={pm => setFormData(prev => ({ ...prev, paymentMethod: pm }))}
          />
        )}
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
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Gasto saldado</span>
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
