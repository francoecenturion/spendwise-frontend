import { useState, useEffect, FormEvent } from 'react';
import { IssuingEntityFormProps, IssuingEntity } from '../types';

export default function IssuingEntityForm({ issuingEntity, onSubmit, onCancel }: IssuingEntityFormProps) {
  const [formData, setFormData] = useState<IssuingEntity>({
    description: '',
  });

  useEffect(() => {
    if (issuingEntity) {
      setFormData({
        description: issuingEntity.description,
        enabled: issuingEntity.enabled,
      });
    } else {
      setFormData({ description: '' });
    }
  }, [issuingEntity]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
          placeholder="Ej: Banco Nación, Banco Galicia, Naranja X..."
        />
      </div>

      {issuingEntity && (
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled ?? true}
              onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-stone-900 focus:ring-stone-900"
            />
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Entidad activa</span>
          </label>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 ml-6">
            {(formData.enabled ?? true)
              ? '✅ La entidad está disponible para usar'
              : '⛔ La entidad está deshabilitada y no aparecerá en los selectores'}
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button type="submit" className="btn btn-primary flex-1">
          {issuingEntity ? 'Actualizar' : 'Crear'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
