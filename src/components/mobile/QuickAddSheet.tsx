import { useNavigate } from 'react-router-dom';

interface QuickAddSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function QuickAddSheet({ open, onClose }: QuickAddSheetProps) {
  const navigate = useNavigate();

  if (!open) return null;

  const handleSelect = (path: string) => {
    onClose();
    navigate(`${path}?new=1`);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-stone-900 rounded-t-2xl shadow-2xl animate-fade-in">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-stone-200 dark:bg-stone-700 rounded-full" />
        </div>

        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50 px-6 pb-4 pt-1">
          ¿Qué querés registrar?
        </h2>

        <div className="px-4 pb-10 space-y-3">
          {/* Gasto */}
          <button
            onClick={() => handleSelect('/expenses')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 active:scale-95 transition-transform text-left"
          >
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/60 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-stone-900 dark:text-stone-50">Gasto</p>
              <p className="text-sm text-stone-500 dark:text-stone-400">Registrar un nuevo gasto</p>
            </div>
          </button>

          {/* Ingreso */}
          <button
            onClick={() => handleSelect('/income')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-green-50 dark:bg-green-950/40 active:scale-95 transition-transform text-left"
          >
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/60 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-stone-900 dark:text-stone-50">Ingreso</p>
              <p className="text-sm text-stone-500 dark:text-stone-400">Registrar un nuevo ingreso</p>
            </div>
          </button>

          {/* Gasto con tarjeta */}
          <button
            onClick={() => handleSelect('/card-expenses')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 active:scale-95 transition-transform text-left"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/60 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-stone-900 dark:text-stone-50">Gasto con tarjeta</p>
              <p className="text-sm text-stone-500 dark:text-stone-400">Registrar un gasto de crédito o débito</p>
            </div>
          </button>

          {/* Deuda personal */}
          <button
            onClick={() => handleSelect('/debts')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 active:scale-95 transition-transform text-left"
          >
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/60 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-stone-900 dark:text-stone-50">Deuda personal</p>
              <p className="text-sm text-stone-500 dark:text-stone-400">Registrar una deuda con una persona</p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
