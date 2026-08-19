import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { MerchantShortcutFormProps, MerchantShortcut, Category, CategoryType } from '../types';
import { categoryService } from '../services/api';
import IconPicker from './IconPicker.tsx';
import CategoryPicker from './CategoryPicker.tsx';

export default function MerchantShortcutForm({ merchantShortcut, onSubmit, onCancel }: MerchantShortcutFormProps) {
  const [formData, setFormData] = useState<MerchantShortcut>({
    name: '',
    icon: 'ShoppingBag',
    enabled: true,
    category: { name: '' },
  });
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    categoryService.getAll({ enabled: true, type: CategoryType.EXPENSE }, 0, 1000).then(res => setCategories(res.content));
  }, []);

  useEffect(() => {
    if (merchantShortcut) {
      setFormData({
        ...merchantShortcut,
        icon: merchantShortcut.icon || 'ShoppingBag',
      });
    }
  }, [merchantShortcut]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.category.id) { alert('Por favor seleccioná una categoría'); return; }
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
          placeholder="Ej: Uber, Netflix…"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Ícono
        </label>
        <IconPicker
          value={formData.icon || 'ShoppingBag'}
          onChange={icon => setFormData(prev => ({ ...prev, icon }))}
          type="category"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
          Categoría
        </label>
        <CategoryPicker
          categories={categories}
          value={formData.category.id ? formData.category : undefined}
          onChange={cat => setFormData(prev => ({ ...prev, category: cat }))}
          emptyMessage="⚠️ No hay categorías activas. Creá una primero."
        />
      </div>

      {merchantShortcut && (
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="enabled"
              checked={formData.enabled ?? true}
              onChange={handleChange}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-stone-900 focus:ring-stone-900"
            />
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Acceso rápido activo</span>
          </label>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 ml-6">
            {formData.enabled
              ? '✅ Aparece en el selector al cargar un gasto'
              : '⛔ Deshabilitado y no aparecerá en el selector'}
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button type="submit" className="btn btn-primary flex-1">
          {merchantShortcut ? 'Actualizar' : 'Crear'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
