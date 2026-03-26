import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!email.trim()) newErrors.email = 'El email es requerido';
    if (!password) newErrors.password = 'La contraseña es requerida';
    else if (password.length < 8) newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      setErrors({});
      const response = await authService.login({ email: email.trim(), password });
      login(response.token, response.email, response.name, response.surname, response.profilePicture, response.role);
      navigate('/', { replace: true });
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 401) {
        setErrors({ general: 'Email o contraseña incorrectos.' });
      } else if (status === 403) {
        setErrors({ general: 'Tu cuenta no está verificada. Revisá tu email.' });
      } else {
        setErrors({ general: 'Ocurrió un error. Intentá de nuevo.' });
      }
    } finally {
      setLoading(false);
    }
  };

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

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-1">Iniciar sesión</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
            Ingresá con tu cuenta para continuar
          </p>

          {/* General error */}
          {errors.general && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Email
              </label>
              <input
                type="email"
                className={`input-field ${errors.email ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Contraseña
                </label>
                <Link to="/forgot-password" className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                type="password"
                className={`input-field ${errors.password ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-4">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="font-medium text-stone-900 dark:text-stone-100 hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
