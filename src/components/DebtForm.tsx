import { useState, useEffect, FormEvent } from 'react';
import { DebtFormProps, Debt, IssuingEntity, PaymentMethod, Currency } from '../types';
import { issuingEntityService, paymentMethodService, currencyService } from '../services/api';
import CurrencyPicker from './CurrencyPicker';
import PaymentMethodPicker from './PaymentMethodPicker';


const formatAmountDisplay = (stripped: string): string => {
  const parts = stripped.split(',');
  const intFormatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.length > 1 ? `${intFormatted},${parts[1]}` : intFormatted;
};

const parseAmountFromDisplay = (display: string): number => {
  return parseFloat(display.replace(/\./g, '').replace(',', '.')) || 0;
};

const numberToDisplay = (value?: number): string => {
  if (!value) return '';
  return value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export default function DebtForm({ debt, onSubmit, onCancel }: DebtFormProps) {
  const [issuingEntities, setIssuingEntities] = useState<IssuingEntity[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [amountRaw, setAmountRaw] = useState('');

  const [formData, setFormData] = useState<Debt>({
    description: '',
    amountInPesos: 0,
    inputAmount: 0,
    date: new Date().toISOString().split('T')[0],
    personal: true,
    currency: { name: '', symbol: '' },
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (debt) {
      const displayAmount = debt.amountInDollars != null ? debt.amountInDollars : (debt.amountInPesos ?? 0);
      setFormData({
        ...debt,
        date: debt.date.split('T')[0],
        dueDate: debt.dueDate ? debt.dueDate.split('T')[0] : undefined,
        inputAmount: displayAmount,
        currency: debt.currency ?? { name: '', symbol: '' },
      });
      setAmountRaw(numberToDisplay(displayAmount));
    }
  }, [debt]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entitiesResponse, pmResponse, currenciesResponse] = await Promise.all([
        issuingEntityService.getAll({ enabled: true }, 0, 1000),
        paymentMethodService.getAll({ enabled: true }, 0, 1000),
        currencyService.getAll({}, 0, 1000),
      ]);
      setIssuingEntities(entitiesResponse.content);
      setPaymentMethods(pmResponse.content);
      setCurrencies(currenciesResponse.content);
      if (!debt) {
        const defaultCurrency = currenciesResponse.content.find(c => c.isDefault);
        if (defaultCurrency) {
          setFormData(prev => ({ ...prev, currency: defaultCurrency }));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
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

  const handlePersonalToggle = (isPersonal: boolean) => {
    setFormData(prev => ({
      ...prev,
      personal: isPersonal,
      creditor: isPersonal ? prev.creditor : undefined,
      issuingEntity: isPersonal ? undefined : prev.issuingEntity,
    }));
  };

  const handleIssuingEntityChange = (id: string) => {
    const selected = issuingEntities.find(e => e.id === Number(id));
    setFormData(prev => ({ ...prev, issuingEntity: selected ?? undefined }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.personal && !formData.creditor?.trim()) {
      alert('Ingresá el nombre del acreedor');
      return;
    }
    if (!formData.personal && !formData.issuingEntity?.id) {
      alert('Seleccioná una entidad emisora');
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-stone-100"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tipo de deuda */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Tipo de deuda</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handlePersonalToggle(true)}
            className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
              formData.personal
                ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                : 'border-stone-200 text-stone-600 hover:border-stone-400 dark:border-stone-700 dark:text-stone-400 dark:hover:border-stone-500'
            }`}
          >
            Personal
          </button>
          <button
            type="button"
            onClick={() => handlePersonalToggle(false)}
            className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
              !formData.personal
                ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                : 'border-stone-200 text-stone-600 hover:border-stone-400 dark:border-stone-700 dark:text-stone-400 dark:hover:border-stone-500'
            }`}
          >
            Institucional
          </button>
        </div>
      </div>

      {/* Acreedor — condicional */}
      {formData.personal ? (
        <div>
          <label htmlFor="creditor" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Nombre del acreedor
          </label>
          <input
            type="text"
            id="creditor"
            value={formData.creditor ?? ''}
            onChange={(e) => setFormData(prev => ({ ...prev, creditor: e.target.value }))}
            className="input-field"
            required
            placeholder="Ej: Juan Pérez, María García..."
          />
        </div>
      ) : (
        <div>
          <label htmlFor="issuingEntityId" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Entidad emisora
          </label>
          <select
            id="issuingEntityId"
            value={formData.issuingEntity?.id ?? ''}
            onChange={(e) => handleIssuingEntityChange(e.target.value)}
            className="input-field"
            required
          >
            <option value="">Seleccioná una entidad</option>
            {issuingEntities.map((e) => (
              <option key={e.id} value={e.id}>{e.description}</option>
            ))}
          </select>
          {issuingEntities.length === 0 && (
            <p className="text-sm text-amber-600 mt-1">
              ⚠️ No hay entidades activas. Crea una primero en Entidades Financieras.
            </p>
          )}
        </div>
      )}

      {/* Descripción */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Descripción
        </label>
        <input
          type="text"
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="input-field"
          required
          placeholder="Ej: Cuota tarjeta, Préstamo de dinero..."
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
              onChange={(e) => handleAmountChange(e.target.value)}
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

      {formData.currency?.id && (
        <p className="text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2">
          💡 El monto se guardará en {formData.currency.symbol || formData.currency.name}. No se realiza conversión de moneda.
        </p>
      )}

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Fecha de la deuda
          </label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="input-field"
            required
          />
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Vencimiento <span className="text-stone-400 dark:text-stone-500 font-normal">opcional</span>
          </label>
          <input
            type="date"
            id="dueDate"
            value={formData.dueDate ?? ''}
            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value || undefined }))}
            className="input-field"
          />
        </div>
      </div>

      {/* Método de pago (opcional) */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
          Método de pago <span className="text-stone-400 dark:text-stone-500 font-normal">opcional</span>
        </label>
        <PaymentMethodPicker
          paymentMethods={paymentMethods}
          value={formData.paymentMethod?.id ? formData.paymentMethod : undefined}
          onChange={pm => setFormData(prev => ({ ...prev, paymentMethod: pm }))}
          optional
        />
      </div>

      {/* Estado cancelada (solo en edición) */}
      {debt && (
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.cancelled ?? false}
              onChange={(e) => setFormData(prev => ({ ...prev, cancelled: e.target.checked }))}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-stone-900 focus:ring-stone-900"
            />
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Deuda cancelada</span>
          </label>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 ml-6">
            {(formData.cancelled ?? false)
              ? '✅ La deuda está saldada'
              : '⏳ La deuda sigue pendiente'}
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button type="submit" className="btn btn-primary flex-1">
          {debt ? 'Actualizar' : 'Registrar Deuda'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
