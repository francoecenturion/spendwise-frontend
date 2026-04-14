import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProfileModal from '../components/ProfileModal';
import { gmailService } from '../services/api';
import { GmailStatus } from '../types';
import {
  History, Mail, Target, Repeat2, Tag, CreditCard, CircleDollarSign,
  PiggyBank, Wallet, Landmark, ChevronRight, User, LogOut,
} from 'lucide-react';

interface MenuItem {
  label: string;
  path: string;
  icon: JSX.Element;
}

const menuItems: MenuItem[] = [
  { label: 'Histórico',             path: '/history',            icon: <History size={20} /> },
  { label: 'Importaciones',         path: '/mail-imports',       icon: <Mail size={20} /> },
  { label: 'Presupuesto',           path: '/budget',             icon: <Target size={20} /> },
  { label: 'Gastos Recurrentes',    path: '/recurrent-expenses', icon: <Repeat2 size={20} /> },
  { label: 'Categorías',            path: '/categories',         icon: <Tag size={20} /> },
  { label: 'Métodos de Pago',       path: '/payment-methods',    icon: <CreditCard size={20} /> },
  { label: 'Monedas',               path: '/currencies',         icon: <CircleDollarSign size={20} /> },
  { label: 'Tarjetas',               path: '/card-expenses',      icon: <CreditCard size={20} /> },
  { label: 'Ahorros',               path: '/savings',            icon: <PiggyBank size={20} /> },
  { label: 'Billeteras / Cuentas',  path: '/savings-wallets',    icon: <Wallet size={20} /> },
  { label: 'Entidades Financieras', path: '/issuing-entities',   icon: <Landmark size={20} /> },
];

export default function MorePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  // Gmail connection state
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [showGmailForm, setShowGmailForm] = useState(false);
  const [gmailEmail, setGmailEmail] = useState('');
  const [gmailPassword, setGmailPassword] = useState('');
  const [gmailError, setGmailError] = useState<string | null>(null);

  useEffect(() => {
    gmailService.getStatus()
      .then(setGmailStatus)
      .catch(() => setGmailStatus({ isActive: false }));
  }, []);

  const handleGmailConnect = async () => {
    if (!gmailEmail || !gmailPassword) return;
    setGmailLoading(true);
    setGmailError(null);
    try {
      const result = await gmailService.saveCredential(gmailEmail, gmailPassword);
      setGmailStatus(result);
      setShowGmailForm(false);
      setGmailEmail('');
      setGmailPassword('');
    } catch {
      setGmailError('Error al conectar. Verificá el email y la contraseña de aplicación.');
    } finally {
      setGmailLoading(false);
    }
  };

  const handleGmailDisconnect = async () => {
    setGmailLoading(true);
    try {
      await gmailService.disconnect();
      setGmailStatus({ isActive: false });
      setShowGmailForm(false);
    } catch {
      // ignore
    } finally {
      setGmailLoading(false);
    }
  };

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

      {/* Gmail section */}
      <div className="px-4 pt-6 pb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-1">Importación de mails</p>
      </div>

      <div className="mx-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
        {gmailStatus === null ? (
          <div className="p-4 flex justify-center">
            <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          </div>
        ) : gmailStatus.isActive ? (
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-900 dark:text-stone-50">Gmail conectado</p>
                <p className="text-xs text-stone-400 dark:text-stone-500">{gmailStatus.gmailEmail}</p>
              </div>
            </div>
            <button
              onClick={handleGmailDisconnect}
              disabled={gmailLoading}
              className="btn btn-danger w-full text-sm py-2"
            >
              {gmailLoading ? 'Desconectando...' : 'Desconectar Gmail'}
            </button>
          </div>
        ) : showGmailForm ? (
          <div className="p-4 space-y-3">
            <p className="text-sm font-medium text-stone-900 dark:text-stone-50">Conectar Gmail</p>
            <input
              type="email"
              className="input-field"
              placeholder="tu@gmail.com"
              value={gmailEmail}
              onChange={e => setGmailEmail(e.target.value)}
            />
            <input
              type="password"
              className="input-field"
              placeholder="Contraseña de aplicación (16 caracteres)"
              value={gmailPassword}
              onChange={e => setGmailPassword(e.target.value)}
            />
            {gmailError && (
              <p className="text-xs text-red-500 dark:text-red-400">{gmailError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowGmailForm(false); setGmailError(null); }}
                className="btn btn-secondary flex-1 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleGmailConnect}
                disabled={gmailLoading || !gmailEmail || !gmailPassword}
                className="btn btn-primary flex-1 text-sm"
              >
                {gmailLoading ? 'Conectando...' : 'Conectar'}
              </button>
            </div>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Usá una contraseña de aplicación de Google (no tu contraseña normal).
              Requiere verificación en dos pasos activada.
            </p>
          </div>
        ) : (
          <button
            onClick={() => setShowGmailForm(true)}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
          >
            <div className="w-9 h-9 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-400 flex-shrink-0">
              <Mail size={20} />
            </div>
            <span className="flex-1 font-medium text-stone-900 dark:text-stone-50">Conectar Gmail</span>
            <ChevronRight size={16} className="text-stone-400" />
          </button>
        )}
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
