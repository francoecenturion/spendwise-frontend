import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { IncomeFormProps, Income, Category } from '../types';
import { categoryService } from '../services/api';

export default function IncomeForm({ income, onSubmit, onCancel }: IncomeFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [amountRaw, setAmountRaw] = useState<string>('');

  const [formData, setFormData] = useState<Income>({
    description: '',
    amountInPesos: 0,
    date: new Date().toISOString().split('T')[0],
    source: { name: '' },
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (income) {
      setFormData({
        ...income,
        date: income.date.split('T')[0],
      });
      setAmountRaw(income.amountInPesos.toString());
    }
  }, [income]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getAll({ enabled: true }, 0, 1000);
      setCategories(response.content);
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'sourceId') {
      const selectedCategory = categories.find(c => c.id === Number(value));
      if (selectedCategory) {
        setFormData(prev => ({ ...prev, source: selectedCategory }));
      }
    } else if (name === 'amountInPesos') {
      if (/^\d*[.,]?\d*$/.test(value)) {
        setAmountRaw(value);
        setFormData(prev => ({ ...prev, amountInPesos: parseFloat(value.replace(',', '.')) || 0 }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.source.id) {
      alert('Por favor selecciona una fuente de ingreso');
      return;
    }
    if (formData.amountInPesos <= 0) {
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
          placeholder="Ej: Sueldo, Freelance, Alquiler, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="amountInPesos" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Monto (ARS)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400">$</span>
            <input
              type="text"
              inputMode="decimal"
              id="amountInPesos"
              name="amountInPesos"
              value={amountRaw}
              onChange={handleChange}
              className="input-field pl-7"
              required
              placeholder="0.00"
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
        <label htmlFor="sourceId" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          Fuente
        </label>
        <select
          id="sourceId"
          name="sourceId"
          value={formData.source.id || ''}
          onChange={handleChange}
          className="input-field"
          required
        >
          <option value="">Selecciona una fuente</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {categories.length === 0 && (
          <p className="text-sm text-amber-600 mt-1">
            ⚠️ No hay categorías activas. Crea una primero.
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="btn btn-primary flex-1"
          disabled={categories.length === 0}
        >
          {income ? 'Guardar Cambios' : 'Crear Ingreso'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
