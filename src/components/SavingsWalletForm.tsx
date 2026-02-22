import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { SavingsWalletFormProps, SavingsWallet, SavingsWalletType } from '../types';

const walletTypeLabels: Record<SavingsWalletType, string> = {
  [SavingsWalletType.BANK_ACCOUNT]: 'Cuenta Bancaria',
  [SavingsWalletType.VIRTUAL_WALLET]: 'Billetera Virtual',
  [SavingsWalletType.MUTUAL_FUND]: 'Fondo Común de Inversión',
  [SavingsWalletType.FIXED_TERM]: 'Plazo Fijo',
  [SavingsWalletType.CASH]: 'Efectivo',
};

const walletTypeIcons: Record<SavingsWalletType, string> = {
  [SavingsWalletType.BANK_ACCOUNT]: '🏦',
  [SavingsWalletType.VIRTUAL_WALLET]: '📱',
  [SavingsWalletType.MUTUAL_FUND]: '📈',
  [SavingsWalletType.FIXED_TERM]: '🔒',
  [SavingsWalletType.CASH]: '💵',
};

export default function SavingsWalletForm({ savingsWallet, onSubmit, onCancel }: SavingsWalletFormProps) {
  const [formData, setFormData] = useState<SavingsWallet>({
    name: '',
    savingsWalletType: SavingsWalletType.BANK_ACCOUNT,
    enabled: true,
    icon: '🏦',
  });

  useEffect(() => {
    if (savingsWallet) {
      setFormData({ ...savingsWallet });
    }
  }, [savingsWallet]);

  // Sync icon when type changes (only if user hasn't customized it)
  const handleTypeChange = (type: SavingsWalletType) => {
    setFormData(prev => ({
      ...prev,
      savingsWalletType: type,
      icon: walletTypeIcons[type],
    }));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === 'savingsWalletType') {
      handleTypeChange(value as SavingsWalletType);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
          placeholder="Ej: Cuenta Galicia, Mercado Pago, Efectivo, etc."
        />
      </div>

      <div>
        <label htmlFor="savingsWalletType" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Tipo
        </label>
        <select
          id="savingsWalletType"
          name="savingsWalletType"
          value={formData.savingsWalletType}
          onChange={handleChange}
          className="input-field"
          required
        >
          {Object.values(SavingsWalletType).map((type) => (
            <option key={type} value={type}>
              {walletTypeIcons[type]} {walletTypeLabels[type]}
            </option>
          ))}
        </select>
      </div>

      {savingsWallet && (
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="enabled"
              checked={formData.enabled ?? true}
              onChange={handleChange}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-stone-900 focus:ring-stone-900"
            />
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Billetera activa</span>
          </label>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 ml-6">
            {formData.enabled
              ? '✅ La billetera está disponible'
              : '⛔ La billetera está deshabilitada'}
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button type="submit" className="btn btn-primary flex-1">
          {savingsWallet ? 'Actualizar' : 'Crear'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
