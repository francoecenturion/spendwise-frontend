import { PaymentMethod } from '../types';

interface PaymentMethodPickerProps {
  paymentMethods: PaymentMethod[];
  value?: PaymentMethod;
  onChange: (pm: PaymentMethod | undefined) => void;
  emptyMessage?: string;
  optional?: boolean;
}

export default function PaymentMethodPicker({ paymentMethods, value, onChange, emptyMessage, optional }: PaymentMethodPickerProps) {
  if (paymentMethods.length === 0) {
    return (
      <p className="text-sm text-amber-600 dark:text-amber-400">
        {emptyMessage ?? '⚠️ No hay métodos de pago activos. Creá uno primero.'}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {optional && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
            !value
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
          }`}
        >
          Ninguno
        </button>
      )}
      {paymentMethods.map(pm => {
        const selected = value?.id === pm.id;
        return (
          <button
            key={pm.id}
            type="button"
            onClick={() => onChange(pm)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
              selected
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            {pm.icon && <img src={pm.icon} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />}
            <span>{pm.name}</span>
          </button>
        );
      })}
    </div>
  );
}
