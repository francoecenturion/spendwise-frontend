import { useState, useEffect, FormEvent } from 'react';
import { CategoryFormProps, Category, CategoryType } from '../types';

const categoryTypeLabels: Record<CategoryType, string> = {
  [CategoryType.INCOME]: 'Ingreso',
  [CategoryType.EXPENSE]: 'Gasto',
  [CategoryType.SAVING]: 'Ahorro',
  [CategoryType.DEBT]: 'Deuda',
  [CategoryType.INVESTMENT]: 'Inversión',
};

export default function CategoryForm({ category, onSubmit, onCancel }: CategoryFormProps) {
  const [formData, setFormData] = useState<Category>({
    name: '',
    type: CategoryType.EXPENSE,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        type: category.type ?? CategoryType.EXPENSE,
        enabled: category.enabled,
      });
    } else {
      setFormData({ name: '', type: CategoryType.EXPENSE });
    }
  }, [category]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Nombre de la Categoría
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="input-field"
          required
          placeholder="Ej: Comida, Transporte, Salario, etc."
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Tipo de Categoría
        </label>
        <select
          id="type"
          value={formData.type ?? CategoryType.EXPENSE}
          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CategoryType }))}
          className="input-field"
          required
        >
          {Object.values(CategoryType).map((t) => (
            <option key={t} value={t}>{categoryTypeLabels[t]}</option>
          ))}
        </select>
      </div>

      {category && (
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled ?? true}
              onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-stone-900 focus:ring-stone-900"
            />
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Categoría activa</span>
          </label>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 ml-6">
            {(formData.enabled ?? true)
              ? '✅ La categoría está disponible para usar'
              : '⛔ La categoría está deshabilitada y no aparecerá en los selectores'}
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button type="submit" className="btn btn-primary flex-1">
          {category ? 'Actualizar' : 'Crear'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
