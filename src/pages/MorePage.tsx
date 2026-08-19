import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProfileModal from '../components/ProfileModal';
import {
  Target, Repeat2, Tag, CircleDollarSign, Zap,
  PiggyBank, Wallet, Landmark, ChevronRight, User, LogOut,
} from 'lucide-react';

interface MenuItem {
  label: string;
  path: string;
  icon: JSX.Element;
}

const menuItems: MenuItem[] = [
  { label: 'Presupuesto',           path: '/budget',             icon: <Target size={20} /> },
  { label: 'Gastos Recurrentes',    path: '/recurrent-expenses', icon: <Repeat2 size={20} /> },
  { label: 'Categorías',            path: '/categories',         icon: <Tag size={20} /> },
  { label: 'Accesos Rápidos',       path: '/merchant-shortcuts', icon: <Zap size={20} /> },
  { label: 'Monedas',               path: '/currencies',         icon: <CircleDollarSign size={20} /> },
  { label: 'Ahorros',               path: '/savings',            icon: <PiggyBank size={20} /> },
  { label: 'Billeteras / Cuentas',  path: '/savings-wallets',    icon: <Wallet size={20} /> },
  { label: 'Entidades Financieras', path: '/issuing-entities',   icon: <Landmark size={20} /> },
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
            <ChevronRight size={16} className="text-stone-400" />
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
              <User size={20} className="text-stone-500 dark:text-stone-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-stone-900 dark:text-stone-50 truncate">
              {user?.name} {user?.surname}
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{user?.email}</p>
          </div>
          <ChevronRight size={16} className="text-stone-400 flex-shrink-0" />
        </button>

        {/* Logout row */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
        >
          <div className="w-9 h-9 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0">
            <LogOut size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <span className="flex-1 font-medium text-red-600 dark:text-red-400">Cerrar sesión</span>
        </button>
      </div>

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
