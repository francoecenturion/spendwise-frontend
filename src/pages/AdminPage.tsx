import { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import { RecommendedCurrency, RecommendedEntity, RecommendedPaymentMethod } from '../types';

type Tab = 'currencies' | 'entities' | 'payment-methods';

interface CurrencyFormState {
  name: string;
  symbol: string;
  displayOrder: string;
  defaultSelected: boolean;
}

interface EntityFormState {
  name: string;
  imageUrl: string;
  displayOrder: string;
}

interface PmFormState {
  name: string;
  imageUrl: string;
  paymentMethodType: string;
  recommendedEntityId: string;
  displayOrder: string;
}

const PAYMENT_METHOD_TYPES = [
  { value: 'CREDIT_CARD', label: 'Tarjeta de Crédito' },
  { value: 'DEBIT_CARD', label: 'Tarjeta de Débito' },
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('currencies');
  const [currencies, setCurrencies] = useState<RecommendedCurrency[]>([]);
  const [entities, setEntities] = useState<RecommendedEntity[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<RecommendedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Currency form
  const [currencyForm, setCurrencyForm] = useState<CurrencyFormState>({ name: '', symbol: '', displayOrder: '', defaultSelected: false });
  const [editingCurrencyId, setEditingCurrencyId] = useState<number | null>(null);
  const [showCurrencyForm, setShowCurrencyForm] = useState(false);

  // Entity form
  const [entityForm, setEntityForm] = useState<EntityFormState>({ name: '', imageUrl: '', displayOrder: '' });
  const [editingEntityId, setEditingEntityId] = useState<number | null>(null);
  const [showEntityForm, setShowEntityForm] = useState(false);

  // PM form
  const [pmForm, setPmForm] = useState<PmFormState>({ name: '', imageUrl: '', paymentMethodType: 'CREDIT_CARD', recommendedEntityId: '', displayOrder: '' });
  const [editingPmId, setEditingPmId] = useState<number | null>(null);
  const [showPmForm, setShowPmForm] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, e, pm] = await Promise.all([
        adminService.listCurrencies(),
        adminService.listEntities(),
        adminService.listPaymentMethods(),
      ]);
      setCurrencies(c);
      setEntities(e);
      setPaymentMethods(pm);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Currency handlers ─────────────────────────────────────────────────────

  const openCurrencyCreate = () => {
    setEditingCurrencyId(null);
    setCurrencyForm({ name: '', symbol: '', displayOrder: '', defaultSelected: false });
    setShowCurrencyForm(true);
  };

  const openCurrencyEdit = (c: RecommendedCurrency) => {
    setEditingCurrencyId(c.id);
    setCurrencyForm({ name: c.name, symbol: c.symbol, displayOrder: String(c.displayOrder ?? ''), defaultSelected: c.defaultSelected ?? false });
    setShowCurrencyForm(true);
  };

  const saveCurrency = async () => {
    const data = {
      name: currencyForm.name,
      symbol: currencyForm.symbol,
      displayOrder: currencyForm.displayOrder ? parseInt(currencyForm.displayOrder) : undefined,
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
    setEntityForm({ name: '', imageUrl: '', displayOrder: '' });
    setShowEntityForm(true);
  };

  const openEntityEdit = (e: RecommendedEntity) => {
    setEditingEntityId(e.id);
    setEntityForm({ name: e.name, imageUrl: e.imageUrl || '', displayOrder: String(e.displayOrder ?? '') });
    setShowEntityForm(true);
  };

  const saveEntity = async () => {
    const data = {
      name: entityForm.name,
      imageUrl: entityForm.imageUrl || undefined,
      displayOrder: entityForm.displayOrder ? parseInt(entityForm.displayOrder) : undefined,
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

  // ── PM handlers ───────────────────────────────────────────────────────────

  const openPmCreate = () => {
    setEditingPmId(null);
    setPmForm({ name: '', imageUrl: '', paymentMethodType: 'CREDIT_CARD', recommendedEntityId: '', displayOrder: '' });
    setShowPmForm(true);
  };

  const openPmEdit = (pm: RecommendedPaymentMethod) => {
    setEditingPmId(pm.id);
    setPmForm({
      name: pm.name,
      imageUrl: pm.imageUrl || '',
      paymentMethodType: pm.paymentMethodType || 'CREDIT_CARD',
      recommendedEntityId: pm.recommendedEntityId ? String(pm.recommendedEntityId) : '',
      displayOrder: String(pm.displayOrder ?? ''),
    });
    setShowPmForm(true);
  };

  const savePm = async () => {
    const data = {
      name: pmForm.name,
      imageUrl: pmForm.imageUrl || undefined,
      paymentMethodType: pmForm.paymentMethodType,
      recommendedEntityId: pmForm.recommendedEntityId ? parseInt(pmForm.recommendedEntityId) : undefined,
      displayOrder: pmForm.displayOrder ? parseInt(pmForm.displayOrder) : undefined,
    };
    try {
      if (editingPmId) {
        await adminService.updatePaymentMethod(editingPmId, data as any);
      } else {
        await adminService.createPaymentMethod(data as any);
      }
      setShowPmForm(false);
      load();
    } catch {
      setError('Error al guardar medio de pago');
    }
  };

  const deletePm = async (id: number) => {
    if (!confirm('¿Eliminar este medio de pago?')) return;
    try {
      await adminService.deletePaymentMethod(id);
      load();
    } catch {
      setError('Error al eliminar');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-6">
        Panel de Administración
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-stone-200 dark:border-stone-700 overflow-x-auto">
        {(['currencies', 'entities', 'payment-methods'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'
            }`}
          >
            {t === 'currencies' ? 'Monedas' : t === 'entities' ? 'Entidades Financieras' : 'Medios de Pago'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-stone-500 text-sm">Cargando...</div>
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
      ) : tab === 'entities' ? (
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
      ) : (
        <PmTab
          paymentMethods={paymentMethods}
          entities={entities}
          showForm={showPmForm}
          form={pmForm}
          setForm={setPmForm}
          editingId={editingPmId}
          onNew={openPmCreate}
          onEdit={openPmEdit}
          onDelete={deletePm}
          onSave={savePm}
          onCancel={() => setShowPmForm(false)}
        />
      )}
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-stone-500 dark:text-stone-400">{currencies.length} monedas</span>
        <button className="btn btn-primary" onClick={onNew}>+ Nueva moneda</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-3">
            {editingId ? 'Editar moneda' : 'Nueva moneda'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              className="input-field"
              placeholder="Nombre (ej. Peso Argentino)"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Símbolo (ej. $)"
              value={form.symbol}
              onChange={e => setForm({ ...form, symbol: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Orden"
              type="number"
              value={form.displayOrder}
              onChange={e => setForm({ ...form, displayOrder: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
              <input
                type="checkbox"
                checked={form.defaultSelected}
                onChange={e => setForm({ ...form, defaultSelected: e.target.checked })}
                className="rounded"
              />
              Preseleccionada
            </label>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="btn btn-primary" onClick={onSave}>Guardar</button>
            <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Símbolo</th>
              <th>Orden</th>
              <th>Default</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map(c => (
              <tr key={c.id}>
                <td className="text-stone-500 text-sm">{c.id}</td>
                <td className="font-medium">{c.name}</td>
                <td className="font-mono font-bold text-stone-700 dark:text-stone-300">{c.symbol}</td>
                <td>{c.displayOrder}</td>
                <td>{c.defaultSelected ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Sí</span> : <span className="text-stone-400 text-xs">—</span>}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-secondary text-xs py-1 px-2" onClick={() => onEdit(c)}>Editar</button>
                    <button className="btn btn-danger text-xs py-1 px-2" onClick={() => onDelete(c.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-stone-500 dark:text-stone-400">{entities.length} entidades</span>
        <button className="btn btn-primary" onClick={onNew}>+ Nueva entidad</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-3">
            {editingId ? 'Editar entidad' : 'Nueva entidad'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="input-field"
              placeholder="Nombre"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="URL de imagen (Cloudinary)"
              value={form.imageUrl}
              onChange={e => setForm({ ...form, imageUrl: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Orden"
              type="number"
              value={form.displayOrder}
              onChange={e => setForm({ ...form, displayOrder: e.target.value })}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button className="btn btn-primary" onClick={onSave}>Guardar</button>
            <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Imagen</th>
              <th>Orden</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {entities.map(e => (
              <tr key={e.id}>
                <td className="text-stone-500 text-sm">{e.id}</td>
                <td className="font-medium">{e.name}</td>
                <td>
                  {e.imageUrl ? (
                    <img src={e.imageUrl} alt={e.name} className="w-8 h-8 rounded object-contain" />
                  ) : (
                    <span className="text-stone-400 text-xs">—</span>
                  )}
                </td>
                <td>{e.displayOrder}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-secondary text-xs py-1 px-2" onClick={() => onEdit(e)}>Editar</button>
                    <button className="btn btn-danger text-xs py-1 px-2" onClick={() => onDelete(e.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── PM Tab ────────────────────────────────────────────────────────────────────

function PmTab({
  paymentMethods, entities, showForm, form, setForm, editingId,
  onNew, onEdit, onDelete, onSave, onCancel,
}: {
  paymentMethods: RecommendedPaymentMethod[];
  entities: RecommendedEntity[];
  showForm: boolean;
  form: PmFormState;
  setForm: (f: PmFormState) => void;
  editingId: number | null;
  onNew: () => void;
  onEdit: (pm: RecommendedPaymentMethod) => void;
  onDelete: (id: number) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const entityName = (id?: number) => entities.find(e => e.id === id)?.name ?? '—';

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-stone-500 dark:text-stone-400">{paymentMethods.length} medios</span>
        <button className="btn btn-primary" onClick={onNew}>+ Nuevo medio</button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-3">
            {editingId ? 'Editar medio de pago' : 'Nuevo medio de pago'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="input-field"
              placeholder="Nombre"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="URL de imagen (Cloudinary)"
              value={form.imageUrl}
              onChange={e => setForm({ ...form, imageUrl: e.target.value })}
            />
            <select
              className="input-field"
              value={form.paymentMethodType}
              onChange={e => setForm({ ...form, paymentMethodType: e.target.value })}
            >
              {PAYMENT_METHOD_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select
              className="input-field"
              value={form.recommendedEntityId}
              onChange={e => setForm({ ...form, recommendedEntityId: e.target.value })}
            >
              <option value="">Sin entidad (genérico)</option>
              {entities.map(e => (
                <option key={e.id} value={String(e.id)}>{e.name}</option>
              ))}
            </select>
            <input
              className="input-field"
              placeholder="Orden"
              type="number"
              value={form.displayOrder}
              onChange={e => setForm({ ...form, displayOrder: e.target.value })}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button className="btn btn-primary" onClick={onSave}>Guardar</button>
            <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Imagen</th>
              <th>Tipo</th>
              <th>Entidad</th>
              <th>Orden</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paymentMethods.map(pm => (
              <tr key={pm.id}>
                <td className="text-stone-500 text-sm">{pm.id}</td>
                <td className="font-medium">{pm.name}</td>
                <td>
                  {pm.imageUrl ? (
                    <img src={pm.imageUrl} alt={pm.name} className="w-8 h-8 rounded object-contain" />
                  ) : (
                    <span className="text-stone-400 text-xs">—</span>
                  )}
                </td>
                <td className="text-xs text-stone-600 dark:text-stone-400">{pm.paymentMethodType}</td>
                <td className="text-sm">{entityName(pm.recommendedEntityId)}</td>
                <td>{pm.displayOrder}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-secondary text-xs py-1 px-2" onClick={() => onEdit(pm)}>Editar</button>
                    <button className="btn btn-danger text-xs py-1 px-2" onClick={() => onDelete(pm.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
