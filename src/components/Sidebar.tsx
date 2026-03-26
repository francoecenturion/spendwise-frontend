import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProfileModal from './ProfileModal';
import { mailImportService } from '../services/api';
import {
  Tag, CreditCard, TrendingUp, Receipt, CircleDollarSign, PiggyBank,
  Wallet, ClipboardList, Repeat2, Landmark, Target, Mail, History,
  Settings, Menu, X, User, Sun, Moon, LogOut,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: JSX.Element;
  badge?: number;
}

interface SidebarProps {
  isDark: boolean;
  toggle: () => void;
}

export default function Sidebar({ isDark, toggle }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingMailCount, setPendingMailCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    mailImportService.getPendingCount()
      .then(data => setPendingMailCount(data.count))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems: NavItem[] = [
    { name: 'Categorías',          path: '/',                   icon: <Tag size={18} /> },
    { name: 'Métodos de Pago',     path: '/payment-methods',    icon: <CreditCard size={18} /> },
    { name: 'Ingresos',            path: '/income',             icon: <TrendingUp size={18} /> },
    { name: 'Gastos',              path: '/expenses',           icon: <Receipt size={18} /> },
    { name: 'Monedas',             path: '/currencies',         icon: <CircleDollarSign size={18} /> },
    { name: 'Ahorros',             path: '/savings',            icon: <PiggyBank size={18} /> },
    { name: 'Billeteras / Cuentas',path: '/savings-wallets',    icon: <Wallet size={18} /> },
    { name: 'Deudas',              path: '/debts',              icon: <ClipboardList size={18} /> },
    { name: 'Gastos Recurrentes',  path: '/recurrent-expenses', icon: <Repeat2 size={18} /> },
    { name: 'Entidades Financieras',path: '/issuing-entities',  icon: <Landmark size={18} /> },
    { name: 'Presupuesto',         path: '/budget',             icon: <Target size={18} /> },
    { name: 'Importaciones',       path: '/mail-imports',       badge: pendingMailCount, icon: <Mail size={18} /> },
    { name: 'Histórico',           path: '/history',            icon: <History size={18} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive(path)
        ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-50'
        : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/60 hover:text-stone-800 dark:hover:text-stone-200'
    }`;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-stone-900 text-white shadow-lg dark:bg-stone-100 dark:text-stone-900"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-stone-900
          border-r border-stone-100 dark:border-stone-800
          transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="h-16 flex-shrink-0 flex items-center px-5 border-b border-stone-100 dark:border-stone-800">
          <Link to="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <div className="w-9 h-9 bg-stone-900 dark:bg-stone-100 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white dark:text-stone-900 font-bold text-base tracking-tight">SW</span>
            </div>
            <span className="text-lg font-bold text-stone-900 dark:text-stone-50 tracking-tight">SpendWise</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-0.5 overflow-y-auto flex-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={navLinkClass(item.path)}
            >
              <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">{item.icon}</span>
              <span className="flex-1 truncate">{item.name}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center leading-none font-semibold">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          ))}
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className={navLinkClass('/admin')}
            >
              <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <Settings size={18} />
              </span>
              <span className="flex-1">Administración</span>
            </Link>
          )}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 p-3 border-t border-stone-100 dark:border-stone-800 space-y-1">
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-stone-500 dark:text-stone-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 truncate">
                {user?.name ?? 'Usuario'}
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{user?.email ?? ''}</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); toggle(); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-100 dark:text-stone-500 dark:hover:bg-stone-800 transition-colors"
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={16} className="flex-shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
