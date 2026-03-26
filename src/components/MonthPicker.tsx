const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface MonthPickerProps {
  year: number;
  month: number; // 1-indexed
  onChange: (year: number, month: number) => void;
}

export default function MonthPicker({ year, month, onChange }: MonthPickerProps) {
  const prev = () => {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  };
  const next = () => {
    const now = new Date();
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return;
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  };

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={prev}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 w-36 text-center">
        {MONTHS[month - 1]} {year}
      </span>

      <button
        onClick={next}
        disabled={isCurrentMonth}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

export function monthBounds(year: number, month: number): { startDate: string; endDate: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = new Date(year, month, 0).toISOString().split('T')[0];
  return { startDate: start, endDate: end };
}
