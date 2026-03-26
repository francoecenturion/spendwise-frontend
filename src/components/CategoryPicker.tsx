import { Category } from '../types';

const BG_COLORS = [
  'bg-red-400', 'bg-orange-400', 'bg-amber-500', 'bg-lime-500',
  'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500',
  'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500',
  'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-400',
];

export function catBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return BG_COLORS[h % BG_COLORS.length];
}

interface CategoryPickerProps {
  categories: Category[];
  value?: Category;
  onChange: (cat: Category) => void;
  emptyMessage?: string;
}

export default function CategoryPicker({ categories, value, onChange, emptyMessage }: CategoryPickerProps) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-amber-600 dark:text-amber-400">
        {emptyMessage ?? '⚠️ No hay categorías activas. Creá una primero.'}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {categories.map(cat => {
        const selected = value?.id === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat)}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all duration-150 ${
              selected
                ? 'bg-stone-100 dark:bg-stone-800'
                : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform ${catBg(cat.name)} ${
              selected ? 'ring-2 ring-stone-900 dark:ring-stone-100 ring-offset-2 ring-offset-white dark:ring-offset-stone-900 scale-110' : ''
            }`}>
              {cat.icon ? (
                <span className="text-xl leading-none">{cat.icon}</span>
              ) : (
                <span className="text-base font-bold text-white leading-none">
                  {cat.name[0].toUpperCase()}
                </span>
              )}
            </div>
            <span className={`text-[11px] font-medium leading-tight text-center w-full truncate ${
              selected ? 'text-stone-900 dark:text-stone-50' : 'text-stone-500 dark:text-stone-400'
            }`}>
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
