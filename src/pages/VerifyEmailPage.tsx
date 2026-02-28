import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api';

type Status = 'loading' | 'success' | 'error_expired' | 'error_invalid' | 'error_no_token';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = searchParams.get('token');

    if (!token) {
      setStatus('error_no_token');
      return;
    }

    authService.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        const httpStatus = err.response?.status;
        if (httpStatus === 400) {
          setStatus('error_expired');
        } else {
          setStatus('error_invalid');
        }
      });
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-stone-900 dark:bg-stone-100 rounded-lg flex items-center justify-center">
            <span className="text-white dark:text-stone-900 font-bold text-xl">SW</span>
          </div>
          <span className="text-2xl font-bold text-stone-900 dark:text-stone-50">SpendWise</span>
        </div>

        <div className="card p-8 text-center space-y-4">
          {status === 'loading' && (
            <>
              <svg className="w-12 h-12 text-stone-400 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-stone-600 dark:text-stone-400">Verificando tu cuenta…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">¡Cuenta verificada!</h1>
              <p className="text-stone-500 dark:text-stone-400">
                Tu email fue confirmado exitosamente. Ya podés iniciar sesión.
              </p>
              <Link to="/login" className="btn btn-primary inline-block mt-2">
                Ir al login
              </Link>
            </>
          )}

          {status === 'error_expired' && (
            <>
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">Link expirado</h1>
              <p className="text-stone-500 dark:text-stone-400">
                El link de verificación expiró (tiene 24 horas de validez). Registrate de nuevo para recibir uno nuevo.
              </p>
              <Link to="/register" className="btn btn-primary inline-block mt-2">
                Registrarme de nuevo
              </Link>
            </>
          )}

          {(status === 'error_invalid' || status === 'error_no_token') && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">Link inválido</h1>
              <p className="text-stone-500 dark:text-stone-400">
                Este link de verificación no es válido. Puede que ya hayas verificado tu cuenta.
              </p>
              <Link to="/login" className="btn btn-primary inline-block mt-2">
                Ir al login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
