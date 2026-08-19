import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Settings } from 'lucide-react';
import { adminService } from '../services/api';
import { RecommendedCurrency, RecommendedEntity, RecommendedCategory, CategoryType } from '../types';
import { uploadToCloudinary } from '../services/cloudinary';
import Modal from '../components/Modal';
import IconPicker from '../components/IconPicker';
import CategoryIcon from '../components/CategoryIcon';

type Tab = 'categories' | 'currencies' | 'entities';

interface CurrencyFormState {
  name: string;
  symbol: string;
  defaultSelected: boolean;
}

interface EntityFormState {
  name: string;
  iconUrl: string;
}

interface CategoryFormState {
  name: string;
  icon: string;
  type: CategoryType;
}

const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  [CategoryType.INCOME]: 'Ingreso',
  [CategoryType.EXPENSE]: 'Gasto',
  [CategoryType.SAVING]: 'Ahorro',
  [CategoryType.DEBT]: 'Deuda',
  [CategoryType.INVESTMENT]: 'Inversión',
};

const CATEGORY_TYPE_STYLES: Record<CategoryType, string> = {
  [CategoryType.INCOME]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [CategoryType.EXPENSE]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [CategoryType.SAVING]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [CategoryType.DEBT]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [CategoryType.INVESTMENT]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('categories');
  const [categories, setCategories] = useState<RecommendedCategory[]>([]);
  const [currencies, setCurrencies] = useState<RecommendedCurrency[]>([]);
  const [entities, setEntities] = useState<RecommendedEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category form
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>({ name: '', icon: '', type: CategoryType.EXPENSE });
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // Currency form
  const [currencyForm, setCurrencyForm] = useState<CurrencyFormState>({ name: '', symbol: '', defaultSelected: false });
  const [editingCurrencyId, setEditingCurrencyId] = useState<number | null>(null);
  const [showCurrencyForm, setShowCurrencyForm] = useState(false);

  // Entity form
  const [entityForm, setEntityForm] = useState<EntityFormState>({ name: '', iconUrl: '' });
  const [editingEntityId, setEditingEntityId] = useState<number | null>(null);
  const [showEntityForm, setShowEntityForm] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, c, e] = await Promise.all([
        adminService.listCategories(),
        adminService.listCurrencies(),
        adminService.listEntities(),
      ]);
      setCategories(cats);
      setCurrencies(c);
      setEntities(e);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Category handlers ─────────────────────────────────────────────────────

  const openCategoryCreate = () => {
    setEditingCategoryId(null);
    setCategoryForm({ name: '', icon: '', type: CategoryType.EXPENSE });
    setShowCategoryForm(true);
  };

  const openCategoryEdit = (cat: RecommendedCategory) => {
    setEditingCategoryId(cat.id);
    setCategoryForm({ name: cat.name, icon: cat.icon || '', type: cat.type });
    setShowCategoryForm(true);
  };

  const saveCategory = async () => {
    const data = {
      name: categoryForm.name,
      icon: categoryForm.icon || undefined,
      type: categoryForm.type,
    };
    try {
      if (editingCategoryId) {
        await adminService.updateCategory(editingCategoryId, data as any);
      } else {
        await adminService.createCategory(data as any);
      }
      setShowCategoryForm(false);
      load();
    } catch {
      setError('Error al guardar categoría');
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try {
      await adminService.deleteCategory(id);
      load();
    } catch {
      setError('Error al eliminar');
    }
  };

  // ── Currency handlers ─────────────────────────────────────────────────────

  const openCurrencyCreate = () => {
    setEditingCurrencyId(null);
    setCurrencyForm({ name: '', symbol: '', defaultSelected: false });
    setShowCurrencyForm(true);
  };

  const openCurrencyEdit = (c: RecommendedCurrency) => {
    setEditingCurrencyId(c.id);
    setCurrencyForm({ name: c.name, symbol: c.symbol, defaultSelected: c.defaultSelected ?? false });
    setShowCurrencyForm(true);
  };

  const saveCurrency = async () => {
    const data = {
      name: currencyForm.name,
      symbol: currencyForm.symbol,
      defaultSelected: currencyForm.defaultSelected,
    };
    try {
      if (editingCurrencyId) {
        await adminService.updateCurrency(editingCurrencyId, data);
      } else {
        await adminService.createCurrency(data as any);
      }
      setShowCurrencyForm(false);
      load();
    } catch {
      setError('Error al guardar moneda');
    }
  };

  const deleteCurrency = async (id: number) => {
    if (!confirm('¿Eliminar esta moneda?')) return;
    try {
      await adminService.deleteCurrency(id);
      load();
    } catch {
      setError('Error al eliminar');
    }
  };

  // ── Entity handlers ───────────────────────────────────────────────────────

  const openEntityCreate = () => {
    setEditingEntityId(null);
    setEntityForm({ name: '', iconUrl: '' });
    setShowEntityForm(true);
  };

  const openEntityEdit = (e: RecommendedEntity) => {
    setEditingEntityId(e.id);
    setEntityForm({ name: e.name, iconUrl: e.iconUrl || '' });
    setShowEntityForm(true);
  };

  const saveEntity = async () => {
    const data = {
      name: entityForm.name,
      iconUrl: entityForm.iconUrl || undefined,
    };
    try {
      if (editingEntityId) {
        await adminService.updateEntity(editingEntityId, data);
      } else {
        await adminService.createEntity(data as any);
      }
      setShowEntityForm(false);
      load();
    } catch {
      setError('Error al guardar entidad');
    }
  };

  const deleteEntity = async (id: number) => {
    if (!confirm('¿Eliminar esta entidad?')) return;
    try {
      await adminService.deleteEntity(id);
      load();
    } catch {
      setError('Error al eliminar');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

      <div className="mb-8 animate-fade-in">
        <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2 flex items-center gap-3">
          <Settings size={36} className="text-teal-700 dark:text-teal-400" />Panel de Administración
        </h1>
        <p className="text-stone-600 dark:text-stone-400">Gestión de datos maestros de la aplicación</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-stone-200 dark:border-stone-800 overflow-x-auto">
        {(['categories', 'currencies', 'entities'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t
                ? 'border-b-2 border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
                : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            {t === 'categories' ? 'Categorías' : t === 'currencies' ? 'Monedas' : 'Entidades Financieras'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      ) : tab === 'categories' ? (
        <CategoryTab
          categories={categories}
          showForm={showCategoryForm}
          form={categoryForm}
          setForm={setCategoryForm}
          editingId={editingCategoryId}
          onNew={openCategoryCreate}
          onEdit={openCategoryEdit}
          onDelete={deleteCategory}
          onSave={saveCategory}
          onCancel={() => setShowCategoryForm(false)}
        />
      ) : tab === 'currencies' ? (
        <CurrencyTab
          currencies={currencies}
          showForm={showCurrencyForm}
          form={currencyForm}
          setForm={setCurrencyForm}
          editingId={editingCurrencyId}
          onNew={openCurrencyCreate}
          onEdit={openCurrencyEdit}
          onDelete={deleteCurrency}
          onSave={saveCurrency}
          onCancel={() => setShowCurrencyForm(false)}
        />
      ) : (
        <EntityTab
          entities={entities}
          showForm={showEntityForm}
          form={entityForm}
          setForm={setEntityForm}
          editingId={editingEntityId}
          onNew={openEntityCreate}
          onEdit={openEntityEdit}
          onDelete={deleteEntity}
          onSave={saveEntity}
          onCancel={() => setShowEntityForm(false)}
        />
      )}
      </div>
    </div>
  );
}

// ── Image Upload Field ────────────────────────────────────────────────────────

function ImageUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Seleccioná un archivo de imagen válido');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen es muy grande. Máximo 5MB');
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <div className="flex items-center gap-2 h-full">
        {value && (
          <img src={value} alt="preview" className="w-9 h-9 rounded object-contain border border-stone-200 dark:border-stone-700 flex-shrink-0" />
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="btn btn-secondary text-sm py-1.5 px-3 disabled:opacity-50"
        >
          {isUploading ? 'Subiendo...' : value ? 'Cambiar imagen' : 'Subir imagen'}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400">
            Quitar
          </button>
        )}
      </div>
      {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
    </div>
  );
}

// ── Category Tab ──────────────────────────────────────────────────────────────

function CategoryTab({
  categories, showForm, form, setForm, editingId,
  onNew, onEdit, onDelete, onSave, onCancel,
}: {
  categories: RecommendedCategory[];
  showForm: boolean;
  form: CategoryFormState;
  setForm: (f: CategoryFormState) => void;
  editingId: number | null;
  onNew: () => void;
  onEdit: (c: RecommendedCategory) => void;
  onDelete: (id: number) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm text-stone-600 dark:text-stone-400">Total: <span className="font-semibold text-stone-900 dark:text-stone-50">{categories.length}</span> categorías</span>
        <button className="btn btn-primary flex items-center gap-2" onClick={onNew}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nueva categoría
        </button>
      </div>

      <Modal isOpen={showForm} onClose={onCancel} title={editingId ? 'Editar categoría' : 'Nueva categoría'}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Nombre</label>
            <input className="input-field" placeholder="Ej. Viajes" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Ícono</label>
            <IconPicker value={form.icon} onChange={icon => setForm({ ...form, icon })} type="category" emojiOnly />
            {form.icon && (
              <button type="button" onClick={() => setForm({ ...form, icon: '' })} className="mt-1.5 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400">
                Quitar ícono
              </button>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Tipo</label>
            <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as CategoryType })}>
              {Object.values(CategoryType).map(t => (
                <option key={t} value={t}>{CATEGORY_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn btn-secondary flex-1" onClick={onCancel}>Cancelar</button>
            <button className="btn btn-primary flex-1" onClick={onSave}>Guardar</button>
          </div>
        </div>
      </Modal>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Ícono</th><th>Nombre</th><th>Tipo</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td className="text-stone-500 text-sm">{cat.id}</td>
                  <td>
                    {cat.icon ? <CategoryIcon icon={cat.icon} size={18} /> : <span className="text-stone-400 text-xs">—</span>}
                  </td>
                  <td className="font-medium">{cat.name}</td>
                  <td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_TYPE_STYLES[cat.type]}`}>{CATEGORY_TYPE_LABELS[cat.type]}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onEdit(cat)} className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors rounded-lg">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => onDelete(cat.id)} className="p-1.5 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors rounded-lg">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Currency Tab ──────────────────────────────────────────────────────────────

function CurrencyTab({
  currencies, showForm, form, setForm, editingId,
  onNew, onEdit, onDelete, onSave, onCancel,
}: {
  currencies: RecommendedCurrency[];
  showForm: boolean;
  form: CurrencyFormState;
  setForm: (f: CurrencyFormState) => void;
  editingId: number | null;
  onNew: () => void;
  onEdit: (c: RecommendedCurrency) => void;
  onDelete: (id: number) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm text-stone-600 dark:text-stone-400">Total: <span className="font-semibold text-stone-900 dark:text-stone-50">{currencies.length}</span> monedas</span>
        <button className="btn btn-primary flex items-center gap-2" onClick={onNew}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nueva moneda
        </button>
      </div>

      <Modal isOpen={showForm} onClose={onCancel} title={editingId ? 'Editar moneda' : 'Nueva moneda'}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Nombre</label>
            <input className="input-field" placeholder="Ej. Peso Argentino" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Símbolo</label>
            <input className="input-field" placeholder="Ej. $" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
            <input type="checkbox" checked={form.defaultSelected} onChange={e => setForm({ ...form, defaultSelected: e.target.checked })} className="rounded" />
            Preseleccionada por defecto
          </label>
          <div className="flex gap-3 pt-2">
            <button className="btn btn-secondary flex-1" onClick={onCancel}>Cancelar</button>
            <button className="btn btn-primary flex-1" onClick={onSave}>Guardar</button>
          </div>
        </div>
      </Modal>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>Símbolo</th><th>Default</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map(c => (
                <tr key={c.id}>
                  <td className="text-stone-500 text-sm">{c.id}</td>
                  <td className="font-medium">{c.name}</td>
                  <td className="font-mono font-bold text-stone-700 dark:text-stone-300">{c.symbol}</td>
                  <td>{c.defaultSelected ? <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">Sí</span> : <span className="text-stone-400 text-xs">—</span>}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onEdit(c)} className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors rounded-lg">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => onDelete(c.id)} className="p-1.5 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors rounded-lg">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Entity Tab ────────────────────────────────────────────────────────────────

function EntityTab({
  entities, showForm, form, setForm, editingId,
  onNew, onEdit, onDelete, onSave, onCancel,
}: {
  entities: RecommendedEntity[];
  showForm: boolean;
  form: EntityFormState;
  setForm: (f: EntityFormState) => void;
  editingId: number | null;
  onNew: () => void;
  onEdit: (e: RecommendedEntity) => void;
  onDelete: (id: number) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm text-stone-600 dark:text-stone-400">Total: <span className="font-semibold text-stone-900 dark:text-stone-50">{entities.length}</span> entidades</span>
        <button className="btn btn-primary flex items-center gap-2" onClick={onNew}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nueva entidad
        </button>
      </div>

      <Modal isOpen={showForm} onClose={onCancel} title={editingId ? 'Editar entidad' : 'Nueva entidad'}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Nombre</label>
            <input className="input-field" placeholder="Ej. Santander" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Ícono</label>
            <ImageUploadField value={form.iconUrl} onChange={url => setForm({ ...form, iconUrl: url })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn btn-secondary flex-1" onClick={onCancel}>Cancelar</button>
            <button className="btn btn-primary flex-1" onClick={onSave}>Guardar</button>
          </div>
        </div>
      </Modal>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>Ícono</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {entities.map(e => (
                <tr key={e.id}>
                  <td className="text-stone-500 text-sm">{e.id}</td>
                  <td className="font-medium">{e.name}</td>
                  <td>
                    {e.iconUrl ? <img src={e.iconUrl} alt={e.name} className="w-8 h-8 rounded object-cover" /> : <span className="text-stone-400 text-xs">—</span>}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onEdit(e)} className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors rounded-lg">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => onDelete(e.id)} className="p-1.5 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors rounded-lg">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
