import { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import CategoryForm from '../components/CategoryForm.tsx';
import { Category, CategoryType, TableColumn, CategoryFilter } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { useIsMobile } from '../hooks/useIsMobile';

export default function CategoryList() {
  const isMobile = useIsMobile();

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

  const modals = (
    <>
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
    </>
  );

  const pagination = totalPages > 1 && (
    <div className="flex items-center justify-center gap-3 py-4">
      <button
        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
        disabled={currentPage === 0}
        className="btn btn-secondary disabled:opacity-50 py-1.5 px-4 text-sm"
      >Anterior</button>
      <span className="text-sm text-stone-500 dark:text-stone-400">{currentPage + 1} / {totalPages}</span>
      <button
        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
        disabled={currentPage >= totalPages - 1}
        className="btn btn-secondary disabled:opacity-50 py-1.5 px-4 text-sm"
      >Siguiente</button>
    </div>
  );

  // ── MOBILE VIEW ─────────────────────────────────────────────────────────────
  if (isMobile) {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900 dark:border-stone-100" />
        </div>
      );
    }

    return (
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Categorías</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{totalElements} registros</p>
          </div>
          <button
            onClick={handleCreate}
            className="w-9 h-9 bg-stone-900 dark:bg-stone-100 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-white dark:text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 pb-3">
          <input
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="input-field"
            placeholder="Buscar por nombre..."
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* List */}
        <div className="bg-white dark:bg-stone-900 border-t border-b border-stone-200 dark:border-stone-800">
          {categories.length === 0 ? (
            <p className="text-center text-stone-400 dark:text-stone-500 py-12 text-sm">Sin categorías</p>
          ) : (
            categories.map((category, index) => (
              <div
                key={category.id}
                className={`flex items-start gap-3 px-4 py-3.5 ${index < categories.length - 1 ? 'border-b border-stone-100 dark:border-stone-800' : ''}`}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-stone-600 dark:text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-stone-900 dark:text-stone-50 truncate">{category.name}</p>
                    {/* Action buttons */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button onClick={() => handleEdit(category)} className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(category)} className="p-1.5 text-stone-400 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-1.5">
                    {category.type && (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${categoryTypeStyles[category.type]}`}>
                        {categoryTypeLabels[category.type]}
                      </span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      category.enabled
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                        : 'bg-stone-100 text-stone-400 dark:bg-stone-800'
                    }`}>
                      {category.enabled ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {pagination}
        {modals}
      </div>
    );
  }

  // ── DESKTOP VIEW ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
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

        {modals}
      </div>
    </div>
  );
}
