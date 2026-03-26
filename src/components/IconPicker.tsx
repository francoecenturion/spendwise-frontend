import { useState, useRef, ChangeEvent } from 'react';
import { uploadToCloudinary } from '../services/cloudinary';
import { CATEGORY_ICONS, isLucideIconName } from './CategoryIcon';
import { ChevronDown } from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  type?: 'category' | 'payment';
  emojiOnly?: boolean;
}

// Íconos disponibles para métodos de pago (se mantienen emoji)
const paymentIcons = [
  { value: '💳', label: 'Tarjeta' },
  { value: '💵', label: 'Efectivo' },
  { value: '🏦', label: 'Banco' },
  { value: '📱', label: 'Mercado Pago' },
  { value: '🪙', label: 'Monedas' },
  { value: '💰', label: 'Billetera' },
  { value: '🔵', label: 'Visa' },
  { value: '🔴', label: 'Mastercard' },
  { value: '🟢', label: 'American Express' },
  { value: '⚡', label: 'Pago Rápido' },
  { value: '🎫', label: 'Vale' },
  { value: '📲', label: 'App' },
];

export default function IconPicker({ value, onChange, type = 'category', emojiOnly = false }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCustomImage = value && (value.startsWith('data:image') || value.startsWith('http'));
  const isCategory = type === 'category';

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadError('Por favor seleccioná un archivo de imagen válido'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('La imagen es muy grande. Máximo 5MB'); return; }
    setUploadError(null);
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
      setIsOpen(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Determine label for the trigger button
  const selectedLabel = (() => {
    if (isCustomImage) return 'Imagen personalizada';
    if (!value) return 'Seleccionar ícono';
    if (isCategory && isLucideIconName(value)) {
      return CATEGORY_ICONS.find(i => i.name === value)?.label ?? value;
    }
    return paymentIcons.find(i => i.value === value)?.label ?? 'Seleccionar ícono';
  })();

  // Preview in the trigger button
  const renderPreview = () => {
    if (isCustomImage) return <img src={value} alt="Ícono" className="w-6 h-6 object-cover rounded" />;
    if (!value) return <span className="text-stone-400 text-sm">—</span>;
    if (isCategory && isLucideIconName(value)) {
      const def = CATEGORY_ICONS.find(i => i.name === value);
      if (def) return <def.Icon size={22} className="text-stone-700 dark:text-stone-200" />;
    }
    return <span className="text-2xl leading-none">{value}</span>;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg hover:border-stone-400 dark:hover:border-stone-500 transition-colors flex items-center justify-between dark:bg-stone-800"
      >
        <span className="flex items-center gap-2">
          {renderPreview()}
          <span className="text-sm text-stone-600 dark:text-stone-400">{selectedLabel}</span>
        </span>
        <ChevronDown size={16} className="text-stone-400 dark:text-stone-500" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg p-3 max-h-80 overflow-y-auto">

            {/* Upload button — solo si no es emojiOnly */}
            {!emojiOnly && (
              <div className="mb-3 pb-3 border-b border-stone-200 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full px-4 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isUploading
                    ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-stone-900" /><span className="text-sm font-medium">Subiendo...</span></>
                    : <span className="text-sm font-medium">Subir imagen</span>
                  }
                </button>
                {uploadError && <p className="text-xs text-red-600 dark:text-red-400 mt-2 text-center">{uploadError}</p>}
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 text-center">PNG, JPG o SVG · Máx. 5MB</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>
            )}

            {/* Category: Lucide icon grid */}
            {isCategory ? (
              <>
                <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mb-2">Elegí un ícono:</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {CATEGORY_ICONS.map(({ name, label, Icon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => { onChange(name); setIsOpen(false); }}
                      title={label}
                      className={`p-2.5 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                        value === name
                          ? 'bg-stone-200 dark:bg-stone-700 ring-2 ring-stone-900 dark:ring-stone-400'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <Icon size={20} className="text-stone-700 dark:text-stone-200" />
                      <span className="text-[9px] text-stone-500 dark:text-stone-400 truncate w-full text-center">{label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              /* Payment: emoji grid */
              <>
                <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mb-2">{emojiOnly ? 'Elegí un emoji:' : 'O elegí un emoji:'}</p>
                <div className="grid grid-cols-4 gap-2">
                  {paymentIcons.map((icon) => (
                    <button
                      key={icon.value}
                      type="button"
                      onClick={() => { onChange(icon.value); setIsOpen(false); }}
                      className={`p-3 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex flex-col items-center gap-1 ${
                        value === icon.value && !isCustomImage
                          ? 'bg-stone-200 dark:bg-stone-700 ring-2 ring-stone-900 dark:ring-stone-400'
                          : ''
                      }`}
                      title={icon.label}
                    >
                      <span className="text-2xl">{icon.value}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
