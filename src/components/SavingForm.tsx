import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { SavingFormProps, Saving, Currency, SavingsWallet } from '../types';
import { currencyService, savingsWalletService } from '../services/api';

const isDollar = (currency: Currency) => {
  const name = (currency.name || '').toLowerCase();
  return name.includes('dolar') || name.includes('dollar') || name.includes('usd');
};

export default function SavingForm({ saving, onSubmit, onCancel }: SavingFormProps) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [wallets, setWallets] = useState<SavingsWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [amountRaw, setAmountRaw] = useState<string>('');

  const [formData, setFormData] = useState<Saving>({
    description: '',
    inputAmount: 0,
    amountInPesos: 0,
    date: new Date().toISOString().split('T')[0],
    currency: { name: '', symbol: '' },
    savingsWallet: undefined,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (saving) {
      const displayAmount = isDollar(saving.currency)
        ? saving.amountInDollars ?? saving.amountInPesos
        : saving.amountInPesos;
      setFormData({
        ...saving,
        date: saving.date.split('T')[0],
        inputAmount: displayAmount,
      });
      setAmountRaw(displayAmount.toString());
    }
  }, [saving]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [currenciesRes, walletsRes] = await Promise.all([
        currencyService.getAll({}, 0, 1000),
        savingsWalletService.getAll({ enabled: true }, 0, 1000),
      ]);
      setCurrencies(currenciesRes.content);
      setWallets(walletsRes.content);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'currencyId') {
      const selected = currencies.find(c => c.id === Number(value));
      if (selected) {
        setFormData(prev => ({ ...prev, currency: selected }));
      }
    } else if (name === 'savingsWalletId') {
      if (value === '') {
        setFormData(prev => ({ ...prev, savingsWallet: undefined }));
      } else {
        const selected = wallets.find(w => w.id === Number(value));
        if (selected) {
          setFormData(prev => ({ ...prev, savingsWallet: selected }));
        }
      }
    } else if (name === 'inputAmount') {
      if (/^\d*[.,]?\d*$/.test(value)) {
        setAmountRaw(value);
        setFormData(prev => ({ ...prev, inputAmount: parseFloat(value.replace(',', '.')) || 0 }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.currency.id) {
      alert('Por favor seleccioná una moneda');
      return;
    }
    if ((formData.inputAmount ?? 0) <= 0) {
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
          required
          placeholder="Ej: Plazo fijo marzo, Ahorro dólares, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="inputAmount" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Monto
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400">$</span>
            <input
              type="text"
              inputMode="decimal"
              id="inputAmount"
              name="inputAmount"
              value={amountRaw}
              onChange={handleChange}
              className="input-field pl-7"
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
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="input-field"
            required
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div>
        <label htmlFor="currencyId" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Moneda
        </label>
        <select
          id="currencyId"
          name="currencyId"
          value={formData.currency.id || ''}
          onChange={handleChange}
          className="input-field"
          required
        >
          <option value="">Seleccioná una moneda</option>
          {currencies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.symbol})
            </option>
          ))}
        </select>
        {currencies.length === 0 && (
          <p className="text-sm text-amber-600 mt-1">
            ⚠️ No hay monedas disponibles. Crea una primero.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="savingsWalletId" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Billetera / Cuenta (opcional)
        </label>
        <select
          id="savingsWalletId"
          name="savingsWalletId"
          value={formData.savingsWallet?.id || ''}
          onChange={handleChange}
          className="input-field"
        >
          <option value="">Sin asignar</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2">
        {isDollar(formData.currency)
          ? '💡 El monto ingresado se guardará como valor en dólares. El equivalente en pesos se calcula automáticamente.'
          : '💡 El equivalente en dólares se calcula automáticamente usando el tipo de cambio oficial del día de la operación.'}
      </p>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="btn btn-primary flex-1"
          disabled={currencies.length === 0}
        >
          {saving ? 'Guardar Cambios' : 'Registrar Ahorro'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
