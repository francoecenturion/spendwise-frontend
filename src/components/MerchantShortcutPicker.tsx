import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Category, MerchantShortcut } from '../types';
import { merchantShortcutService } from '../services/api';
import CategoryIcon from './CategoryIcon';
import { catBg } from './CategoryPicker';
import Modal from './Modal';
import IconPicker from './IconPicker';
import CategoryPicker from './CategoryPicker';

interface MerchantShortcutPickerProps {
  shortcuts: MerchantShortcut[];
  categories: Category[];
  selectedId?: number;
  onSelect: (shortcut: MerchantShortcut | null) => void;
  onCreated: (shortcut: MerchantShortcut) => void;
}

export default function MerchantShortcutPicker({
  shortcuts, categories, selectedId, onSelect, onCreated,
}: MerchantShortcutPickerProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('ShoppingBag');
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeAddForm = () => {
    setAddOpen(false);
    setName('');
    setIcon('ShoppingBag');
    setCategory(undefined);
    setError(null);
  };

  const handleCreate = async () => {
    if (!name.trim() || !category?.id) return;
    setSaving(true);
    setError(null);
    try {
      const created = await merchantShortcutService.create({ name: name.trim(), icon, category });
      onCreated(created);
      onSelect(created);
      closeAddForm();
    } catch {
      setError('Error al crear el acceso rápido.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {shortcuts.map(shortcut => {
          const selected = selectedId === shortcut.id;
          return (
            <button
              key={shortcut.id}
              type="button"
              onClick={() => onSelect(selected ? null : shortcut)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all duration-150 flex-shrink-0 w-16 ${
                selected ? 'bg-stone-100 dark:bg-stone-800' : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform ${catBg(shortcut.name)} ${
                selected ? 'ring-2 ring-stone-900 dark:ring-stone-100 ring-offset-2 ring-offset-white dark:ring-offset-stone-900 scale-110' : ''
              }`}>
                {shortcut.icon ? (
                  <CategoryIcon icon={shortcut.icon} size={22} className="text-white" />
                ) : (
                  <span className="text-base font-bold text-white leading-none">
                    {shortcut.name[0].toUpperCase()}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-medium leading-tight text-center w-full truncate ${
                selected ? 'text-stone-900 dark:text-stone-50' : 'text-stone-500 dark:text-stone-400'
              }`}>
                {shortcut.name}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all duration-150 flex-shrink-0 w-16 hover:bg-stone-50 dark:hover:bg-stone-800/50"
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed border-stone-300 dark:border-stone-600">
            <Plus size={20} className="text-stone-400 dark:text-stone-500" />
          </div>
          <span className="text-[11px] font-medium leading-tight text-center w-full truncate text-stone-500 dark:text-stone-400">
            Agregar
          </span>
        </button>
      </div>

      <Modal isOpen={addOpen} onClose={closeAddForm} title="Nuevo acceso rápido">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field"
              placeholder="Ej: Uber, Netflix…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Ícono</label>
            <IconPicker value={icon} onChange={setIcon} type="category" />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">Categoría</label>
            <CategoryPicker categories={categories} value={category} onChange={setCategory} />
          </div>

          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !name.trim() || !category?.id}
              className="btn btn-primary flex-1"
            >
              {saving ? 'Guardando...' : 'Crear'}
            </button>
            <button type="button" onClick={closeAddForm} className="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
