import { useState, useEffect } from 'react';
import { issuingEntityService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import IssuingEntityForm from '../components/IssuingEntityForm.tsx';
import { IssuingEntity, IssuingEntityFilter, TableColumn } from '../types';
import { useDebounce } from '../hooks/useDebounce';

export default function IssuingEntityList() {
  const [issuingEntities, setIssuingEntities] = useState<IssuingEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<IssuingEntity | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [entityToDelete, setEntityToDelete] = useState<IssuingEntity | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filtros
  const [filters, setFilters] = useState<IssuingEntityFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  // Filtro de descripción con debounce
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const debouncedDescriptionFilter = useDebounce(descriptionFilter, 500);

  useEffect(() => {
    setFilters(prev => ({ ...prev, description: debouncedDescriptionFilter || undefined }));
    setCurrentPage(0);
  }, [debouncedDescriptionFilter]);

  const columns: TableColumn<IssuingEntity>[] = [
    { key: 'id', label: 'ID' },
    { key: 'description', label: 'Descripción' },
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
    loadIssuingEntities();
  }, [currentPage, filters]);

  const loadIssuingEntities = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await issuingEntityService.getAll(filters, currentPage, 20);
      setIssuingEntities(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err) {
      setError('Error al cargar las entidades emisoras. Verifica que el backend esté corriendo en http://localhost:8080');
      console.error('Error loading issuing entities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof IssuingEntityFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setFilters({});
    setDescriptionFilter('');
    setCurrentPage(0);
  };

  const handleCreate = (): void => {
    setSelectedEntity(null);
    setIsModalOpen(true);
  };

  const handleEdit = (entity: IssuingEntity): void => {
    setSelectedEntity(entity);
    setIsModalOpen(true);
  };

  const handleDelete = (entity: IssuingEntity): void => {
    setEntityToDelete(entity);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!entityToDelete?.id) return;

    try {
      await issuingEntityService.delete(entityToDelete.id);
      loadIssuingEntities();
      setIsDeleteModalOpen(false);
      setEntityToDelete(null);
    } catch (err) {
      console.error('Error deleting issuing entity:', err);
      alert('Error al eliminar la entidad emisora');
    }
  };

  const handleSubmit = async (formData: IssuingEntity): Promise<void> => {
    try {
      if (selectedEntity?.id) {
        const enabledChanged = formData.enabled !== selectedEntity.enabled;
        await issuingEntityService.update(selectedEntity.id, formData);
        if (enabledChanged) {
          if (formData.enabled === false) {
            await issuingEntityService.disable(selectedEntity.id);
          } else {
            await issuingEntityService.enable(selectedEntity.id);
          }
        }
      } else {
        await issuingEntityService.create(formData);
      }
      loadIssuingEntities();
      setIsModalOpen(false);
      setSelectedEntity(null);
    } catch (err) {
      console.error('Error saving issuing entity:', err);
      alert('Error al guardar la entidad emisora');
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
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2">Entidades Emisoras</h1>
          <p className="text-stone-600 dark:text-stone-400">Administra los bancos y entidades financieras</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Descripción</label>
                <input
                  type="text"
                  value={descriptionFilter}
                  onChange={(e) => setDescriptionFilter(e.target.value)}
                  className="input-field"
                  placeholder="Buscar por descripción..."
                />
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  ⏱️ La búsqueda se aplica 0.5s después de dejar de escribir
                </p>
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

              <div className="md:col-span-2 flex gap-2">
                <button onClick={clearFilters} className="btn btn-secondary">
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            Total: <span className="font-semibold text-stone-900 dark:text-stone-50">{totalElements}</span> entidades
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
            data={issuingEntities}
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
          title={selectedEntity ? 'Editar Entidad Emisora' : 'Crear Entidad Emisora'}
        >
          <IssuingEntityForm
            issuingEntity={selectedEntity}
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
              ¿Estás seguro de que deseas eliminar <span className="font-semibold">{entityToDelete?.description}</span>?
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
