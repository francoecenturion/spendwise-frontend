import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { PaymentMethodFormProps, PaymentMethod, PaymentMethodType } from '../types';

export default function PaymentMethodForm({ paymentMethod, onSubmit, onCancel }: PaymentMethodFormProps) {
  const [formData, setFormData] = useState<PaymentMethod>({
    name: '',
    paymentMethodType: PaymentMethodType.CASH,
    enabled: true,
  });

  useEffect(() => {
    if (paymentMethod) {
      setFormData(paymentMethod);
    }
  }, [paymentMethod]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const paymentTypeLabels: Record<PaymentMethodType, string> = {
    [PaymentMethodType.CREDIT_CARD_VISA]: 'Tarjeta de Crédito Visa',
    [PaymentMethodType.CREDIT_CARD_MASTERCARD]: 'Tarjeta de Crédito Mastercard',
    [PaymentMethodType.CREDIT_CARD_AMERICAN_EXPRESS]: 'Tarjeta de Crédito American Express',
    [PaymentMethodType.DEBIT_CARD]: 'Tarjeta de Débito',
    [PaymentMethodType.CASH]: 'Efectivo',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-2">
          Nombre del Método de Pago
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="input-field"
          required
          placeholder="Ej: Visa Personal, Efectivo, etc."
        />
      </div>

      <div>
        <label htmlFor="paymentMethodType" className="block text-sm font-medium text-stone-700 mb-2">
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
