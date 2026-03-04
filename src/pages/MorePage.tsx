import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProfileModal from '../components/ProfileModal';

interface MenuItem {
  label: string;
  path: string;
  icon: JSX.Element;
}

const menuItems: MenuItem[] = [
  {
    label: 'Presupuesto',
    path: '/budget',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Gastos Recurrentes',
    path: '/recurrent-expenses',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    label: 'Categorías',
    path: '/categories',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    label: 'Métodos de Pago',
    path: '/payment-methods',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    label: 'Monedas',
    path: '/currencies',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Ahorros',
    path: '/savings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Mis Billeteras',
    path: '/savings-wallets',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Entidades Emisoras',
    path: '/issuing-entities',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    ),
  },
];

export default function MorePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="animate-fade-in pb-6">
      <div className="px-4 pt-5 pb-4">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Más</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">Configuración y secciones adicionales</p>
      </div>

      <div className="bg-white dark:bg-stone-900 border-t border-b border-stone-200 dark:border-stone-800">
        {menuItems.map((item, index) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-4 px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors ${
              index < menuItems.length - 1 ? 'border-b border-stone-100 dark:border-stone-800' : ''
            }`}
          >
            <div className="w-9 h-9 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-400 flex-shrink-0">
              {item.icon}
            </div>
            <span className="flex-1 font-medium text-stone-900 dark:text-stone-50">{item.label}</span>
            <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Account section */}
      <div className="px-4 pt-6 pb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-1">Cuenta</p>
      </div>

      <div className="bg-white dark:bg-stone-900 border-t border-b border-stone-200 dark:border-stone-800">
        {/* Profile row */}
        <button
          onClick={() => setProfileOpen(true)}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors border-b border-stone-100 dark:border-stone-800 text-left"
        >
          <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-5 h-5 text-stone-500 dark:text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-stone-900 dark:text-stone-50 truncate">
              {user?.name} {user?.surname}
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{user?.email}</p>
          </div>
          <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Logout row */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
        >
          <div className="w-9 h-9 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <span className="flex-1 font-medium text-red-600 dark:text-red-400">Cerrar sesión</span>
        </button>
      </div>

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
