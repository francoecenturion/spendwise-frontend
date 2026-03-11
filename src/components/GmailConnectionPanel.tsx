import { useState, useEffect } from 'react';
import { gmailService } from '../services/api';
import { GmailStatus } from '../types';

export default function GmailConnectionPanel() {
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gmailService.getStatus()
      .then(setGmailStatus)
      .catch(() => setGmailStatus({ isActive: false }));
  }, []);

  const handleConnect = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      const result = await gmailService.saveCredential(email, password);
      setGmailStatus(result);
      setShowForm(false);
      setEmail('');
      setPassword('');
    } catch {
      setError('Error al conectar. Verificá el email y la contraseña de aplicación.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await gmailService.disconnect();
      setGmailStatus({ isActive: false });
      setShowForm(false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (gmailStatus === null) return (
    <div className="flex justify-center py-3">
      <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
    </div>
  );

  if (gmailStatus.isActive) return (
    <div className="flex items-center justify-between gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-green-800 dark:text-green-300">Gmail conectado</p>
          <p className="text-xs text-green-600 dark:text-green-400">{gmailStatus.gmailEmail}</p>
        </div>
      </div>
      <button onClick={handleDisconnect} disabled={loading} className="btn btn-danger text-xs px-3 py-1.5">
        {loading ? '...' : 'Desconectar'}
      </button>
    </div>
  );

  if (showForm) return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-3">
      <p className="text-sm font-medium text-stone-900 dark:text-stone-50">Conectar Gmail</p>
      <input
        type="email"
        className="input-field"
        placeholder="tu@gmail.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="input-field"
        placeholder="Contraseña de aplicación (16 caracteres)"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      <p className="text-xs text-stone-400 dark:text-stone-500">
        Generá una en{' '}
        <a
          href="https://myaccount.google.com/apppasswords"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-stone-600 dark:hover:text-stone-300"
        >
          myaccount.google.com/apppasswords
        </a>
      </p>
      <p className="text-xs text-amber-600 dark:text-amber-400">
        Por el momento esta funcionalidad solo está disponible para cuentas de Gmail.
      </p>
      <div className="flex gap-2">
        <button onClick={() => { setShowForm(false); setError(null); }} className="btn btn-secondary flex-1 text-sm">
          Cancelar
        </button>
        <button
          onClick={handleConnect}
          disabled={loading || !email || !password}
          className="btn btn-primary flex-1 text-sm"
        >
          {loading ? 'Conectando...' : 'Conectar'}
        </button>
      </div>
    </div>
  );

  return (
    <button
      onClick={() => setShowForm(true)}
      className="w-full flex items-center gap-3 bg-stone-50 dark:bg-stone-800/50 border border-dashed border-stone-300 dark:border-stone-700 rounded-xl px-4 py-3 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left"
    >
      <svg className="w-5 h-5 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
        Conectar Gmail para importar gastos automáticamente
      </span>
    </button>
  );
}
