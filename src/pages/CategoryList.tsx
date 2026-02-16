import { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import CategoryForm from '../components/CategoryForm.tsx';
import { Category, TableColumn } from '../types';

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const columns: TableColumn<Category>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nombre' },
    {
      key: 'enabled',
      label: 'Estado',
      render: (value: boolean) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
          {value ? 'Activa' : 'Inactiva'}
        </span>
      )
    },
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar las categorías. Verifica que el backend esté corriendo en http://localhost:8080');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (): void => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category): void => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = (category: Category): void => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!categoryToDelete?.id) return;

    try {
      await categoryService.delete(categoryToDelete.id);
      setCategories(categories.filter(cat => cat.id !== categoryToDelete.id));
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Error al eliminar la categoría');
    }
  };

  const handleSubmit = async (formData: Category): Promise<void> => {
    try {
      if (selectedCategory?.id) {
        const updated = await categoryService.update(selectedCategory.id, formData);
        setCategories(categories.map(cat => cat.id === selectedCategory.id ? updated : cat));
      } else {
        const created = await categoryService.create(formData);
        setCategories([...categories, created]);
      }
      setIsModalOpen(false);
      setSelectedCategory(null);
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Error al guardar la categoría');
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900"></div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-stone-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-stone-900 mb-2">Gestión de Categorías</h1>
            <p className="text-stone-600">Administra las categorías de gastos</p>
          </div>

          {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 animate-fade-in">
                {error}
              </div>
          )}

          <div className="flex justify-between items-center mb-6 animate-fade-in">
            <div className="text-sm text-stone-600">
              Total: <span className="font-semibold text-stone-900">{categories.length}</span> categorías
            </div>
            <button onClick={handleCreate} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear Nueva
            </span>
            </button>
          </div>

          <div className="card animate-fade-in">
            <Table
                columns={columns}
                data={categories}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
          </div>

          <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title={selectedCategory ? 'Editar Categoría' : 'Crear Categoría'}
          >
            <CategoryForm
                category={selectedCategory}
                onSubmit={handleSubmit}
                onCancel={() => setIsModalOpen(false)}
            />
          </Modal>

          <Modal
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              title="Confirmar Eliminación"
          >
            <div className="space-y-4">
              <p className="text-stone-600">
                ¿Estás seguro de que deseas eliminar <span className="font-semibold">{categoryToDelete?.name}</span>?
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 pt-4">
                <button onClick={confirmDelete} className="btn btn-danger flex-1">
                  Eliminar
                </button>
                <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
  );
}