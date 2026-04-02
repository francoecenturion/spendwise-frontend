import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import QuickAddSheet from './QuickAddSheet.tsx';
import PWAInstallBanner from '../PWAInstallBanner.tsx';

const navTabs = [
  {
    label: 'Gastos',
    path: '/expenses',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 transition-colors ${active ? 'text-teal-700 dark:text-teal-400' : 'text-stone-400 dark:text-stone-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Ingresos',
    path: '/income',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 transition-colors ${active ? 'text-teal-700 dark:text-teal-400' : 'text-stone-400 dark:text-stone-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    label: 'Deudas',
    path: '/debts',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 transition-colors ${active ? 'text-teal-700 dark:text-teal-400' : 'text-stone-400 dark:text-stone-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: 'Más',
    path: '/more',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 transition-colors ${active ? 'text-teal-700 dark:text-teal-400' : 'text-stone-400 dark:text-stone-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2}
              d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
];

export default function MobileLayout() {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="h-[100dvh] flex flex-col bg-stone-50 dark:bg-stone-950 overflow-hidden">

      {/* Fixed top header */}
      <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-gradient-to-r from-teal-100 to-teal-200 dark:from-teal-800 dark:to-teal-900 backdrop-blur-md border-b border-teal-200 dark:border-teal-800/40 flex items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="SpendWise" className="w-12 h-12 rounded-xl object-cover" />
          <span className="font-bold text-teal-900 dark:text-white text-lg tracking-tight">SpendWise</span>
        </Link>

      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto pt-14 pb-20">
        <Outlet />
      </main>

      {/* Fixed bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-t border-stone-100 dark:border-stone-800">
        <div className="flex items-center justify-around h-16 px-2">

          {/* Left tabs */}
          {navTabs.slice(0, 2).map(tab => {
            const active = isActive(tab.path);
            return (
              <Link key={tab.path} to={tab.path} className="flex-1 flex flex-col items-center py-1">
                <div className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-200 ${
                  active ? 'bg-teal-50 dark:bg-teal-900/20' : ''
                }`}>
                  {tab.icon(active)}
                  <span className={`text-[10px] font-semibold tracking-wide transition-colors ${
                    active ? 'text-teal-700 dark:text-teal-400' : 'text-stone-400 dark:text-stone-500'
                  }`}>
                    {tab.label}
                  </span>
                </div>
              </Link>
            );
          })}

          {/* Center FAB */}
          <button
            onClick={() => setShowQuickAdd(true)}
            className="w-14 h-14 -mt-5 bg-teal-700 dark:bg-teal-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 active:scale-90 transition-transform"
            aria-label="Registrar nuevo"
          >
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Right tabs */}
          {navTabs.slice(2).map(tab => {
            const active = isActive(tab.path);
            return (
              <Link key={tab.path} to={tab.path} className="flex-1 flex flex-col items-center py-1">
                <div className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-200 ${
                  active ? 'bg-teal-50 dark:bg-teal-900/20' : ''
                }`}>
                  {tab.icon(active)}
                  <span className={`text-[10px] font-semibold tracking-wide transition-colors ${
                    active ? 'text-teal-700 dark:text-teal-400' : 'text-stone-400 dark:text-stone-500'
                  }`}>
                    {tab.label}
                  </span>
                </div>
              </Link>
            );
          })}

        </div>
      </nav>

      <QuickAddSheet open={showQuickAdd} onClose={() => setShowQuickAdd(false)} />
      <PWAInstallBanner />
    </div>
  );
}
