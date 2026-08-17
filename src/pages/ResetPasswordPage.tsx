import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(msg ?? 'El enlace es inválido o expiró. Solicitá uno nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center card p-8">
          <p className="text-stone-600 dark:text-stone-400 mb-4">Enlace inválido.</p>
          <Link to="/forgot-password" className="btn btn-primary">Solicitar nuevo enlace</Link>
        </div>
      </div>
    );
  }

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
          {success ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">¡Contraseña actualizada!</h1>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Redirigiendo al inicio de sesión...
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-1">Nueva contraseña</h1>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
                Elegí una contraseña segura de al menos 8 caracteres.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  {error.includes('inválido') || error.includes('expiró') ? (
                    <Link to="/forgot-password" className="text-sm font-medium text-red-700 dark:text-red-400 underline mt-1 block">
                      Solicitar nuevo enlace
                    </Link>
                  ) : null}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Repetí la contraseña"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar contraseña'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
