import { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import CategoryForm from '../components/CategoryForm.tsx';
import { Category, CategoryType, TableColumn, CategoryFilter } from '../types';
import { useDebounce } from '../hooks/useDebounce';

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filtros
  const [filters, setFilters] = useState<CategoryFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  // Filtro de nombre con debounce (espera 500ms después de dejar de escribir)
  const [nameFilter, setNameFilter] = useState('');
  const debouncedNameFilter = useDebounce(nameFilter, 500);

  // Aplicar el debounce al filtro de nombre
  useEffect(() => {
    setFilters(prev => ({ ...prev, name: debouncedNameFilter || undefined }));
    setCurrentPage(0);
  }, [debouncedNameFilter]);

  const categoryTypeLabels: Record<CategoryType, string> = {
    [CategoryType.INCOME]: 'Ingreso',
    [CategoryType.EXPENSE]: 'Gasto',
    [CategoryType.SAVING]: 'Ahorro',
    [CategoryType.DEBT]: 'Deuda',
    [CategoryType.INVESTMENT]: 'Inversión',
  };

  const categoryTypeStyles: Record<CategoryType, string> = {
    [CategoryType.INCOME]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [CategoryType.EXPENSE]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [CategoryType.SAVING]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    [CategoryType.DEBT]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    [CategoryType.INVESTMENT]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };

  const columns: TableColumn<Category>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nombre' },
    {
      key: 'type',
      label: 'Tipo',
      render: (value: CategoryType) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? categoryTypeStyles[value] : 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200'
        }`}>
          {value ? categoryTypeLabels[value] : '-'}
        </span>
      )
    },
    {
      key: 'enabled',
      label: 'Estado',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {value ? 'Activa' : 'Inactiva'}
        </span>
      )
    },
  ];

  useEffect(() => {
    loadCategories();
  }, [currentPage, filters]);

  const loadCategories = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await categoryService.getAll(filters, currentPage, 20);
      setCategories(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err) {
      setError('Error al cargar las categorías. Verifica que el backend esté corriendo en http://localhost:8080');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof CategoryFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(0); // Resetear a primera página al filtrar
  };

  const clearFilters = () => {
    setFilters({});
    setNameFilter('');
    setCurrentPage(0);
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
      loadCategories(); // Recargar lista
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
        const enabledChanged = formData.enabled !== selectedCategory.enabled;
        await categoryService.update(selectedCategory.id, formData);
        if (enabledChanged) {
          if (formData.enabled === false) {
            await categoryService.disable(selectedCategory.id);
          } else {
            await categoryService.enable(selectedCategory.id);
          }
        }
      } else {
        await categoryService.create(formData);
      }
      loadCategories();
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 dark:border-stone-100"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2">Gestión de Categorías</h1>
          <p className="text-stone-600 dark:text-stone-400">Administra las categorías de gastos e ingresos</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-6 animate-fade-in">
            {error}
          </div>
        )}

        {/* Filtros */}
        <div className="card mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Filtros</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50"
            >
              {showFilters ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Nombre</label>
                <input
                  type="text"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="input-field"
                  placeholder="Buscar por nombre..."
                />
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  ⏱️ La búsqueda se aplica 0.5s después de dejar de escribir
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Tipo</label>
                <select
                  value={filters.type ?? ''}
                  onChange={(e) => handleFilterChange('type', e.target.value === '' ? undefined : e.target.value as CategoryType)}
                  className="input-field"
                >
                  <option value="">Todos</option>
                  <option value={CategoryType.INCOME}>Ingreso</option>
                  <option value={CategoryType.EXPENSE}>Gasto</option>
                  <option value={CategoryType.SAVING}>Ahorro</option>
                  <option value={CategoryType.DEBT}>Deuda</option>
                  <option value={CategoryType.INVESTMENT}>Inversión</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Estado</label>
                <select
                  value={filters.enabled === undefined ? '' : filters.enabled ? 'true' : 'false'}
                  onChange={(e) => handleFilterChange('enabled', e.target.value === '' ? undefined : e.target.value === 'true')}
                  className="input-field"
                >
                  <option value="">Todos</option>
                  <option value="true">Activas</option>
                  <option value="false">Inactivas</option>
                </select>
              </div>

              <div className="md:col-span-3 flex gap-2">
                <button onClick={clearFilters} className="btn btn-secondary">
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            Total: <span className="font-semibold text-stone-900 dark:text-stone-50">{totalElements}</span> categorías
            {totalPages > 1 && <span> - Página {currentPage + 1} de {totalPages}</span>}
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

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="btn btn-secondary disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-stone-600 dark:text-stone-400">
              Página {currentPage + 1} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="btn btn-secondary disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}

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
            <p className="text-stone-600 dark:text-stone-400">
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
