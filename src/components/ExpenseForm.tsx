import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { ExpenseFormProps, Expense, Category, PaymentMethod } from '../types';
import { categoryService, paymentMethodService } from '../services/api';

export default function ExpenseForm({ expense, onSubmit, onCancel }: ExpenseFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<Expense>({
    description: '',
    amountInPesos: 0,
    date: new Date().toISOString().split('T')[0], // Fecha de hoy en formato YYYY-MM-DD
    category: { name: '' },
    paymentMethod: { name: '', paymentMethodType: '' },
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (expense) {
      setFormData({
        ...expense,
        date: expense.date.split('T')[0], // Asegurar formato YYYY-MM-DD
      });
    }
  }, [expense]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, paymentMethodsData] = await Promise.all([
        categoryService.getAll(),
        paymentMethodService.getAll(),
      ]);
      setCategories(categoriesData.filter(c => c.enabled));
      setPaymentMethods(paymentMethodsData.filter(pm => pm.enabled));
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error al cargar categorías y métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'categoryId') {
      const selectedCategory = categories.find(c => c.id === Number(value));
      if (selectedCategory) {
        setFormData(prev => ({ ...prev, category: selectedCategory }));
      }
    } else if (name === 'paymentMethodId') {
      const selectedPaymentMethod = paymentMethods.find(pm => pm.id === Number(value));
      if (selectedPaymentMethod) {
        setFormData(prev => ({ ...prev, paymentMethod: selectedPaymentMethod }));
      }
    } else if (name === 'amountInPesos') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.category.id) {
      alert('Por favor selecciona una categoría');
      return;
    }
    if (!formData.paymentMethod.id) {
      alert('Por favor selecciona un método de pago');
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-stone-700 mb-2">
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
          placeholder="Ej: Supermercado, Almuerzo, Netflix, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="amountInPesos" className="block text-sm font-medium text-stone-700 mb-2">
            Monto (ARS)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
            <input
              type="number"
              id="amountInPesos"
              name="amountInPesos"
              value={formData.amountInPesos}
              onChange={handleChange}
              className="input-field pl-7"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-stone-700 mb-2">
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
        <label htmlFor="categoryId" className="block text-sm font-medium text-stone-700 mb-2">
          Categoría
        </label>
        <select
          id="categoryId"
          name="categoryId"
          value={formData.category.id || ''}
          onChange={handleChange}
          className="input-field"
          required
        >
          <option value="">Selecciona una categoría</option>
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

      <div>
        <label htmlFor="paymentMethodId" className="block text-sm font-medium text-stone-700 mb-2">
          Método de Pago
        </label>
        <select
          id="paymentMethodId"
          name="paymentMethodId"
          value={formData.paymentMethod.id || ''}
          onChange={handleChange}
          className="input-field"
          required
        >
          <option value="">Selecciona un método de pago</option>
          {paymentMethods.map((pm) => (
            <option key={pm.id} value={pm.id}>
              {pm.name}
            </option>
          ))}
        </select>
        {paymentMethods.length === 0 && (
          <p className="text-sm text-amber-600 mt-1">
            ⚠️ No hay métodos de pago activos. Crea uno primero.
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button 
          type="submit" 
          className="btn btn-primary flex-1"
          disabled={categories.length === 0 || paymentMethods.length === 0}
        >
          {expense ? 'Actualizar' : 'Crear'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
