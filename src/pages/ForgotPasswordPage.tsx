import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      setLoading(true);
      setError(null);
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-stone-900 dark:bg-stone-100 rounded-lg flex items-center justify-center">
            <span className="text-white dark:text-stone-900 font-bold text-xl">SW</span>
          </div>
          <span className="text-2xl font-bold text-stone-900 dark:text-stone-50">SpendWise</span>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">Revisá tu email</h1>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
                Si <span className="font-medium text-stone-700 dark:text-stone-300">{email}</span> está registrado, vas a recibir un enlace para restablecer tu contraseña. El enlace expira en 1 hora.
              </p>
              <Link to="/login" className="btn btn-secondary w-full block text-center">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-1">Recuperar contraseña</h1>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
                Ingresá tu email y te enviamos un enlace para crear una nueva contraseña.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>
            </>
          )}
        </div>

        {!sent && (
          <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-4">
            <Link to="/login" className="font-medium text-stone-900 dark:text-stone-100 hover:underline">
              ← Volver al inicio de sesión
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
