import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { CategoryFormProps, Category } from '../types';

export default function CategoryForm({ category, onSubmit, onCancel }: CategoryFormProps) {
  const [formData, setFormData] = useState<Category>({
    name: '',
    enabled: true,
  });

  useEffect(() => {
    if (category) {
      setFormData(category);
    }
  }, [category]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-2">
            Nombre de la Categoría
          </label>
          <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              required
              placeholder="Ej: Comida, Transporte, Entretenimiento"
          />
        </div>

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