import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { PaymentMethodFormProps, PaymentMethod, PaymentMethodType } from '../types';
import IconPicker from './IconPicker.tsx';

export default function PaymentMethodForm({ paymentMethod, onSubmit, onCancel }: PaymentMethodFormProps) {
  const [formData, setFormData] = useState<PaymentMethod>({
    name: '',
    paymentMethodType: PaymentMethodType.CREDIT_CARD,
    enabled: true,
    icon: '💵',
  });

  useEffect(() => {
    if (paymentMethod) {
      setFormData({
        ...paymentMethod,
        icon: paymentMethod.icon || '💵',
      });
    }
  }, [paymentMethod]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === 'paymentMethodType') {
      const newType = value as PaymentMethodType;
      setFormData(prev => ({
        ...prev,
        paymentMethodType: newType,
        issuingEntity: showIssuingEntityFor(newType) ? prev.issuingEntity : undefined,
        brand: showBrandFor(newType) ? prev.brand : undefined,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const showIssuingEntityFor = (t: PaymentMethodType) =>
    t === PaymentMethodType.CREDIT_CARD ||
    t === PaymentMethodType.DEBIT_CARD ||
    t === PaymentMethodType.TRANSFER;

  const showBrandFor = (t: PaymentMethodType) =>
    t === PaymentMethodType.CREDIT_CARD || t === PaymentMethodType.DEBIT_CARD;

  const showIssuingEntity = showIssuingEntityFor(formData.paymentMethodType as PaymentMethodType);
  const showBrand = showBrandFor(formData.paymentMethodType as PaymentMethodType);

  const paymentTypeLabels: Record<PaymentMethodType, string> = {
    [PaymentMethodType.CREDIT_CARD]: 'Tarjeta de Crédito',
    [PaymentMethodType.DEBIT_CARD]: 'Tarjeta de Débito',
    [PaymentMethodType.CASH]: 'Efectivo',
    [PaymentMethodType.TRANSFER]: 'Transferencia',
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="paymentMethodType" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Tipo de Método de Pago
        </label>
        <select
          id="paymentMethodType"
          name="paymentMethodType"
          value={formData.paymentMethodType}
          onChange={handleChange}
          className="input-field"
          required
        >
          {Object.values(PaymentMethodType).map((type) => (
            <option key={type} value={type}>
              {paymentTypeLabels[type]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Nombre
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="input-field"
          required
          placeholder="Ej: Visa Personal, Mercado Pago, Efectivo, etc."
        />
      </div>

      {showIssuingEntity && (
        <div className={showBrand ? 'grid grid-cols-2 gap-4' : ''}>
          <div>
            <label htmlFor="issuingEntity" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Entidad Emisora <span className="text-stone-400 dark:text-stone-500 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              id="issuingEntity"
              name="issuingEntity"
              value={formData.issuingEntity || ''}
              onChange={handleChange}
              className="input-field"
              placeholder="Ej: Banco Galicia, BBVA, etc."
            />
          </div>

          {showBrand && (
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Emisor <span className="text-stone-400 dark:text-stone-500 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand || ''}
                onChange={handleChange}
                className="input-field"
                placeholder="Ej: Mastercard, Visa, Amex, etc."
              />
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Ícono
        </label>
        <IconPicker
          value={formData.icon || '💵'}
          onChange={(icon) => setFormData(prev => ({ ...prev, icon }))}
          type="payment"
        />
      </div>

      {paymentMethod && (
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="enabled"
              checked={formData.enabled ?? true}
              onChange={handleChange}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-stone-900 focus:ring-stone-900"
            />
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Método de pago activo</span>
          </label>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 ml-6">
            {formData.enabled
              ? '✅ El método de pago está disponible para usar'
              : '⛔ El método de pago está deshabilitado y no aparecerá en los selectores'}
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button type="submit" className="btn btn-primary flex-1">
          {paymentMethod ? 'Actualizar' : 'Crear'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
