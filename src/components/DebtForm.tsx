import { useState, useEffect, FormEvent } from 'react';
import { DebtFormProps, Debt, IssuingEntity, PaymentMethod } from '../types';
import { issuingEntityService, paymentMethodService } from '../services/api';

export default function DebtForm({ debt, onSubmit, onCancel }: DebtFormProps) {
  const [issuingEntities, setIssuingEntities] = useState<IssuingEntity[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<Debt>({
    description: '',
    amountInPesos: 0,
    date: new Date().toISOString().split('T')[0],
    personal: true,
  });

  const [amountPesosRaw, setAmountPesosRaw] = useState('');
  const [amountDollarsRaw, setAmountDollarsRaw] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (debt) {
      setFormData({
        ...debt,
        date: debt.date.split('T')[0],
        dueDate: debt.dueDate ? debt.dueDate.split('T')[0] : undefined,
      });
      setAmountPesosRaw(debt.amountInPesos.toString());
      setAmountDollarsRaw(debt.amountInDollars?.toString() ?? '');
    }
  }, [debt]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entitiesResponse, pmResponse] = await Promise.all([
        issuingEntityService.getAll({ enabled: true }, 0, 1000),
        paymentMethodService.getAll({ enabled: true }, 0, 1000),
      ]);
      setIssuingEntities(entitiesResponse.content);
      setPaymentMethods(pmResponse.content);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (field: 'amountInPesos' | 'amountInDollars', raw: string) => {
    if (!/^\d*[.,]?\d*$/.test(raw)) return;
    if (field === 'amountInPesos') {
      setAmountPesosRaw(raw);
      setFormData(prev => ({ ...prev, amountInPesos: parseFloat(raw.replace(',', '.')) || 0 }));
    } else {
      setAmountDollarsRaw(raw);
      const val = parseFloat(raw.replace(',', '.'));
      setFormData(prev => ({ ...prev, amountInDollars: raw === '' ? undefined : val }));
    }
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

  const handlePaymentMethodChange = (id: string) => {
    if (id === '') {
      setFormData(prev => ({ ...prev, paymentMethod: undefined }));
      return;
    }
    const selected = paymentMethods.find(pm => pm.id === Number(id));
    setFormData(prev => ({ ...prev, paymentMethod: selected ?? undefined }));
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
    if (formData.amountInPesos <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }
    onSubmit(formData);
  };

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
              ⚠️ No hay entidades activas. Crea una primero en Entidades Emisoras.
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

      {/* Montos */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="amountInPesos" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Monto (ARS)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400">$</span>
            <input
              type="text"
              inputMode="decimal"
              id="amountInPesos"
              value={amountPesosRaw}
              onChange={(e) => handleAmountChange('amountInPesos', e.target.value)}
              className="input-field pl-7"
              required
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="amountInDollars" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Monto (USD) <span className="text-stone-400 dark:text-stone-500 font-normal">opcional</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400">U$S</span>
            <input
              type="text"
              inputMode="decimal"
              id="amountInDollars"
              value={amountDollarsRaw}
              onChange={(e) => handleAmountChange('amountInDollars', e.target.value)}
              className="input-field pl-10"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

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
        <label htmlFor="paymentMethodId" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Método de pago <span className="text-stone-400 dark:text-stone-500 font-normal">opcional</span>
        </label>
        <select
          id="paymentMethodId"
          value={formData.paymentMethod?.id ?? ''}
          onChange={(e) => handlePaymentMethodChange(e.target.value)}
          className="input-field"
        >
          <option value="">Sin método de pago</option>
          {paymentMethods.map((pm) => (
            <option key={pm.id} value={pm.id}>{pm.name}</option>
          ))}
        </select>
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
