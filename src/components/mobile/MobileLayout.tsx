import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import QuickAddSheet from './QuickAddSheet.tsx';

interface MobileLayoutProps {
  isDark: boolean;
  toggle: () => void;
}

const navTabs = [
  {
    label: 'Gastos',
    path: '/expenses',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-stone-900 dark:text-stone-50' : 'text-stone-400 dark:text-stone-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Ingresos',
    path: '/income',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-stone-900 dark:text-stone-50' : 'text-stone-400 dark:text-stone-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    label: 'Deudas',
    path: '/debts',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-stone-900 dark:text-stone-50' : 'text-stone-400 dark:text-stone-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: 'Más',
    path: '/more',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-stone-900 dark:text-stone-50' : 'text-stone-400 dark:text-stone-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2}
              d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
];

export default function MobileLayout({ isDark, toggle }: MobileLayoutProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="h-[100dvh] flex flex-col bg-stone-50 dark:bg-stone-950 overflow-hidden">

      {/* Fixed top header */}
      <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-4 shadow-sm">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-stone-900 dark:bg-stone-100 rounded-lg flex items-center justify-center">
            <span className="text-white dark:text-stone-900 font-bold text-sm">SW</span>
          </div>
          <span className="font-bold text-stone-900 dark:text-stone-50 text-lg">SpendWise</span>
        </Link>

        <button
          onClick={toggle}
          className="p-2 rounded-full text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800 transition-colors"
          aria-label="Cambiar tema"
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </header>

      {/* Scrollable content area */}
      <main className="flex-1 overflow-y-auto pt-14 pb-16">
        <Outlet />
      </main>

      {/* Fixed bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800">
        <div className="flex items-end justify-around h-full pb-2 px-1">

          {/* Gastos */}
          {navTabs.slice(0, 2).map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center gap-1 py-1 px-4 min-w-0"
            >
              {tab.icon(isActive(tab.path))}
              <span className={`text-[10px] font-medium ${isActive(tab.path) ? 'text-stone-900 dark:text-stone-50' : 'text-stone-400 dark:text-stone-500'}`}>
                {tab.label}
              </span>
            </Link>
          ))}

          {/* Center + button */}
          <button
            onClick={() => setShowQuickAdd(true)}
            className="w-14 h-14 -mt-4 bg-stone-900 dark:bg-stone-100 rounded-full flex items-center justify-center shadow-xl flex-shrink-0 active:scale-95 transition-transform"
            aria-label="Registrar nuevo"
          >
            <svg className="w-7 h-7 text-white dark:text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Deudas + Más */}
          {navTabs.slice(2).map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center gap-1 py-1 px-4 min-w-0"
            >
              {tab.icon(isActive(tab.path))}
              <span className={`text-[10px] font-medium ${isActive(tab.path) ? 'text-stone-900 dark:text-stone-50' : 'text-stone-400 dark:text-stone-500'}`}>
                {tab.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      <QuickAddSheet open={showQuickAdd} onClose={() => setShowQuickAdd(false)} />
    </div>
  );
}
