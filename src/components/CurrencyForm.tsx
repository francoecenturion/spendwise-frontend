import { useState, useEffect } from 'react';
import { Currency, CurrencyFormProps } from '../types';

export default function CurrencyForm({ currency, onSubmit, onCancel }: CurrencyFormProps) {
  const [formData, setFormData] = useState<Currency>({
    name: '',
    symbol: '',
  });

  useEffect(() => {
    if (currency) {
      setFormData({
        name: currency.name,
        symbol: currency.symbol,
        enabled: currency.enabled,
      });
    } else {
      setFormData({ name: '', symbol: '' });
    }
  }, [currency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="input-field"
          placeholder="Ej: Dólar Estadounidense"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Símbolo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.symbol}
          onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.slice(0, 1) }))}
          className="input-field"
          placeholder="Ej: $"
          maxLength={1}
          required
        />
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Un solo carácter (ej: $, €, £, ¥)</p>
      </div>

      {currency && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="enabled"
            checked={formData.enabled ?? true}
            onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
            className="w-4 h-4 text-stone-900 rounded border-stone-300 dark:border-stone-600"
          />
          <label htmlFor="enabled" className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Habilitada
          </label>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button type="submit" className="btn btn-primary flex-1">
          {currency ? 'Guardar Cambios' : 'Crear Moneda'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
