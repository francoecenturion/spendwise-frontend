import { useState, useRef, ChangeEvent } from 'react';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  type?: 'category' | 'payment';
}

// Íconos disponibles para categorías
const categoryIcons = [
  { value: '🍔', label: 'Comida' },
  { value: '🚗', label: 'Transporte' },
  { value: '🏠', label: 'Hogar' },
  { value: '⚡', label: 'Servicios' },
  { value: '🎮', label: 'Entretenimiento' },
  { value: '👕', label: 'Ropa' },
  { value: '💊', label: 'Salud' },
  { value: '📚', label: 'Educación' },
  { value: '✈️', label: 'Viajes' },
  { value: '🎁', label: 'Regalos' },
  { value: '💰', label: 'Salario' },
  { value: '📈', label: 'Inversiones' },
  { value: '🏦', label: 'Banco' },
  { value: '💳', label: 'Tarjeta' },
  { value: '🛒', label: 'Compras' },
  { value: '☕', label: 'Café' },
  { value: '🎵', label: 'Música' },
  { value: '💻', label: 'Tecnología' },
  { value: '🐕', label: 'Mascotas' },
  { value: '🏋️', label: 'Gym' },
];

// Íconos disponibles para métodos de pago
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

export default function IconPicker({ value, onChange, type = 'category' }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const icons = type === 'category' ? categoryIcons : paymentIcons;

  // Detectar si el valor es una imagen (base64 o URL) o un emoji
  const isCustomImage = value && (value.startsWith('data:image') || value.startsWith('http'));

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 500KB)
    if (file.size > 500 * 1024) {
      alert('La imagen es muy grande. Máximo 500KB');
      return;
    }

    // Convertir a base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onChange(base64);
      setIsOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg hover:border-stone-400 dark:hover:border-stone-500 transition-colors flex items-center justify-between dark:bg-stone-800"
      >
        <span className="flex items-center gap-2">
          {isCustomImage ? (
            <img
              src={value}
              alt="Ícono personalizado"
              className="w-6 h-6 object-cover rounded"
            />
          ) : (
            <span className="text-2xl">{value || '❓'}</span>
          )}
          <span className="text-sm text-stone-600 dark:text-stone-400">
            {isCustomImage
              ? 'Imagen personalizada'
              : icons.find(i => i.value === value)?.label || 'Seleccionar ícono'}
          </span>
        </span>
        <svg className="w-4 h-4 text-stone-400 dark:text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg p-3 max-h-80 overflow-y-auto">
            {/* Botón para subir imagen personalizada */}
            <div className="mb-3 pb-3 border-b border-stone-200 dark:border-stone-700">
              <button
                type="button"
                onClick={handleUploadClick}
                className="w-full px-4 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Subir imagen personalizada</span>
              </button>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 text-center">
                PNG, JPG o SVG - Máx. 500KB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Grid de emojis */}
            <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mb-2">O elige un emoji:</p>
            <div className="grid grid-cols-4 gap-2">
              {icons.map((icon) => (
                <button
                  key={icon.value}
                  type="button"
                  onClick={() => {
                    onChange(icon.value);
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex flex-col items-center gap-1 ${
                    value === icon.value && !isCustomImage
                      ? 'bg-stone-200 dark:bg-stone-700 ring-2 ring-stone-900 dark:ring-stone-400'
                      : ''
                  }`}
                  title={icon.label}
                >
                  <span className="text-2xl">{icon.value}</span>
                  <span className="text-xs text-stone-600 dark:text-stone-400 text-center">{icon.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
