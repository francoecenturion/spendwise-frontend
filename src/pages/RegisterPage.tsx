import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';

interface FormErrors {
  email?: string;
  name?: string;
  surname?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!email.trim()) newErrors.email = 'El email es requerido';
    if (!name.trim()) newErrors.name = 'El nombre es requerido';
    if (!surname.trim()) newErrors.surname = 'El apellido es requerido';
    if (!password) newErrors.password = 'La contraseña es requerida';
    else if (password.length < 8) newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirmá tu contraseña';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      setErrors({});
      const response = await authService.register({
        email: email.trim(),
        name: name.trim(),
        surname: surname.trim(),
        password,
      });
      setSuccessMessage(response.message);
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 409) {
        setErrors({ email: 'Ya existe una cuenta con ese email.' });
      } else if (status === 400) {
        const msg = err.response?.data?.detail || err.response?.data?.message;
        setErrors({ general: msg || 'Datos inválidos. Revisá los campos.' });
      } else {
        setErrors({ general: 'Ocurrió un error. Intentá de nuevo.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  if (successMessage) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-stone-900 dark:bg-stone-100 rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-stone-900 font-bold text-xl">SW</span>
            </div>
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-50">SpendWise</span>
          </div>
          <div className="card p-8 text-center">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">¡Revisá tu email!</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
              Te enviamos un link de verificación a <span className="font-medium text-stone-700 dark:text-stone-300">{email}</span>.
              Hacé click en el link para activar tu cuenta.
            </p>
            <Link to="/login" className="btn btn-primary w-full block text-center">
              Ir al login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulario de registro ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-stone-900 dark:bg-stone-100 rounded-lg flex items-center justify-center">
            <span className="text-white dark:text-stone-900 font-bold text-xl">SW</span>
          </div>
          <span className="text-2xl font-bold text-stone-900 dark:text-stone-50">SpendWise</span>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-1">Crear cuenta</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
            Completá tus datos para registrarte
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

            {/* Nombre y Apellido en la misma fila */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.name ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Juan"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="given-name"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.surname ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Pérez"
                  value={surname}
                  onChange={e => setSurname(e.target.value)}
                  autoComplete="family-name"
                />
                {errors.surname && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.surname}</p>
                )}
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                className={`input-field ${errors.password ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              {errors.password ? (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>
              ) : (
                <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">Mínimo 8 caracteres</p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Confirmar contraseña
              </label>
              <input
                type="password"
                className={`input-field ${errors.confirmPassword ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Repetí tu contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-4">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-medium text-stone-900 dark:text-stone-100 hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
