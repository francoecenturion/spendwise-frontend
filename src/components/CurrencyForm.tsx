import { useState, useEffect } from 'react';
import { Currency, CurrencyFormProps } from '../types';
import IconPicker from './IconPicker';

export default function CurrencyForm({ currency, onSubmit, onCancel }: CurrencyFormProps) {
  const [formData, setFormData] = useState<Currency>({
    name: '',
    symbol: '',
    isDefault: false,
  });

  useEffect(() => {
    if (currency) {
      setFormData({
        name: currency.name,
        symbol: currency.symbol,
        enabled: currency.enabled,
        isDefault: currency.isDefault ?? false,
        icon: currency.icon,
      });
    } else {
      setFormData({ name: '', symbol: '', isDefault: false });
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
          onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.slice(0, 3) }))}
          className="input-field"
          placeholder="Ej: ARS, USD, $"
          maxLength={3}
          required
        />
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Hasta 3 caracteres (ej: ARS, USD, €)</p>
      </div>

      {/* Ícono */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Ícono <span className="text-stone-400 font-normal">(opcional)</span>
        </label>
        <IconPicker
          value={formData.icon || ''}
          onChange={icon => setFormData(prev => ({ ...prev, icon }))}
          type="category"
          emojiOnly
        />
        {formData.icon && (
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, icon: undefined }))}
            className="mt-1.5 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
          >
            Quitar ícono
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault ?? false}
          onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
          className="w-4 h-4 text-stone-900 rounded border-stone-300 dark:border-stone-600"
        />
        <label htmlFor="isDefault" className="text-sm font-medium text-stone-700 dark:text-stone-300">
          Moneda por defecto
        </label>
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
