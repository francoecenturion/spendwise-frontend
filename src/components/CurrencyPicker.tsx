import { Currency } from '../types';

interface CurrencyPickerProps {
  currencies: Currency[];
  value?: Currency;
  onChange: (currency: Currency) => void;
  emptyMessage?: string;
}

export default function CurrencyPicker({ currencies, value, onChange, emptyMessage = 'No hay monedas disponibles' }: CurrencyPickerProps) {
  if (currencies.length === 0) {
    return <p className="text-sm text-stone-400 dark:text-stone-500 py-2">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currencies.map(currency => {
        const selected = value?.id === currency.id;
        return (
          <button
            key={currency.id}
            type="button"
            onClick={() => onChange(currency)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
              selected
                ? 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 border-stone-900 dark:border-stone-50'
                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500'
            }`}
          >
            {currency.icon ? (
              <span className="text-base leading-none">{currency.icon}</span>
            ) : (
              <span className={`text-sm font-bold leading-none ${selected ? 'text-white dark:text-stone-900' : 'text-stone-500 dark:text-stone-400'}`}>
                {currency.symbol}
              </span>
            )}
            <span>{currency.name}</span>
          </button>
        );
      })}
    </div>
  );
}
