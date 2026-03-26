import { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { authService, setupService } from '../services/api';
import { RecommendedCurrency, SetupRecommendations } from '../types';

// ── Step progress bar ──────────────────────────────────────────────────────────
function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: total }, (_, i) => i + 1).map((step, idx) => (
        <Fragment key={step}>
          {idx > 0 && (
            <div className={`h-0.5 w-10 transition-colors ${step <= current ? 'bg-stone-800 dark:bg-stone-200' : 'bg-stone-200 dark:bg-stone-700'}`} />
          )}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0
            ${step < current
              ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900'
              : step === current
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 ring-4 ring-stone-200 dark:ring-stone-700'
                : 'bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500'
            }`}
          >
            {step < current
              ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              : step
            }
          </div>
        </Fragment>
      ))}
    </div>
  );
}

// ── Selection card ─────────────────────────────────────────────────────────────
function SelectionCard({
  label, iconUrl, code, selected, onClick,
}: {
  label: string; iconUrl?: string; code?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left w-full
        ${selected
          ? 'border-stone-900 dark:border-stone-100 bg-stone-50 dark:bg-stone-800'
          : 'border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 bg-white dark:bg-stone-900'
        }`}
    >
      {/* Badge: code for currencies, image or initial for entities */}
      {code ? (
        <div className="w-12 h-10 bg-stone-100 dark:bg-stone-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-stone-700 dark:text-stone-200">{code}</span>
        </div>
      ) : iconUrl ? (
        <img src={iconUrl} alt={label} className="w-12 h-10 object-contain rounded-lg flex-shrink-0 bg-white" />
      ) : (
        <div className="w-12 h-10 bg-stone-200 dark:bg-stone-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-base font-bold text-stone-600 dark:text-stone-300">{label[0]}</span>
        </div>
      )}
      <span className="text-sm font-medium text-stone-800 dark:text-stone-200 flex-1">{label}</span>
      {selected && (
        <svg className="w-5 h-5 text-stone-900 dark:text-stone-100 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [step, setStep] = useState(1);

  // Step 1
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // Step 2
  const [currencyOptions, setCurrencyOptions] = useState<RecommendedCurrency[]>([]);
  const [selectedCurrencyIds, setSelectedCurrencyIds] = useState<number[]>([]);

  // Step 3
  const [recommendations, setRecommendations] = useState<SetupRecommendations | null>(null);
  const [selectedEntityIds, setSelectedEntityIds] = useState<number[]>([]);

  // Step 4
  const [selectedPmIds, setSelectedPmIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load recommendations (currencies, entities, payment methods) when entering step 2
  useEffect(() => {
    if (step === 2 && recommendations === null) {
      setupService.getRecommendations()
        .then(data => {
          setRecommendations(data);
          setCurrencyOptions(data.currencies ?? []);
          const defaultIds = (data.currencies ?? []).filter(c => c.defaultSelected).map(c => c.id);
          setSelectedCurrencyIds(defaultIds);
        })
        .catch(() => setRecommendations({ currencies: [], entities: [], paymentMethods: [] }));
    }
  }, [step]);

  // ── Navigation ───────────────────────────────────────────────────────────────
  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = 'El email es requerido';
    if (!name.trim()) errs.name = 'El nombre es requerido';
    if (!surname.trim()) errs.surname = 'El apellido es requerido';
    if (!password) errs.password = 'La contraseña es requerida';
    else if (password.length < 8) errs.password = 'Mínimo 8 caracteres';
    if (!confirmPassword) errs.confirmPassword = 'Confirmá tu contraseña';
    else if (password !== confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden';
    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => setStep(s => s + 1);
  const goBack = () => setStep(s => s - 1);
  const skip = () => setStep(s => s + 1);

  const handleStep1Next = () => {
    if (validateStep1()) goNext();
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.register({
        email: email.trim(),
        name: name.trim(),
        surname: surname.trim(),
        password,
        currencies: selectedCurrencyIds.map(id => {
          const opt = currencyOptions.find(c => c.id === id)!;
          return { name: opt.name, symbol: opt.symbol };
        }),
        selectedEntityIds,
        selectedPaymentMethodIds: selectedPmIds,
      });
      setStep(5);
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 409) setError('Ya existe una cuenta con ese email.');
      else setError('Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── Toggle helpers ───────────────────────────────────────────────────────────
  const toggleCurrency = (id: number) =>
    setSelectedCurrencyIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const toggleEntity = (id: number) =>
    setSelectedEntityIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const togglePm = (id: number) =>
    setSelectedPmIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  // Payment methods filtered by selected entities + generic (no entity)
  const filteredPms = (recommendations?.paymentMethods ?? []).filter(pm =>
    pm.recommendedEntityId == null || selectedEntityIds.includes(pm.recommendedEntityId)
  );

  // ── Logo ─────────────────────────────────────────────────────────────────────
  const Logo = () => (
    <div className="flex items-center justify-center gap-3 mb-6">
      <div className="w-9 h-9 bg-stone-900 dark:bg-stone-100 rounded-lg flex items-center justify-center">
        <span className="text-white dark:text-stone-900 font-bold text-lg">SW</span>
      </div>
      <span className="text-xl font-bold text-stone-900 dark:text-stone-50">SpendWise</span>
    </div>
  );

  // ── Success screen ────────────────────────────────────────────────────────────
  if (step === 5) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md animate-fade-in">
          <Logo />
          <div className="card p-8 text-center">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">¡Revisá tu email!</h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
              Te enviamos un link de verificación a{' '}
              <span className="font-medium text-stone-700 dark:text-stone-300">{email}</span>.
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

  // ── Wizard wrapper ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg animate-fade-in">
        <Logo />
        <StepProgress current={step} total={4} />

        <div className="card p-6 md:p-8">

          {/* ── Step 1: Basic info ──────────────────────────────────────────── */}
          {step === 1 && (
            <>
              <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-1">Crear cuenta</h1>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">Completá tus datos para registrarte</p>

              {step1Errors.general && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-400">{step1Errors.general}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Email</label>
                  <input type="email" className={`input-field ${step1Errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                  {step1Errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{step1Errors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Nombre</label>
                    <input type="text" className={`input-field ${step1Errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Juan" value={name} onChange={e => setName(e.target.value)} autoComplete="given-name" />
                    {step1Errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{step1Errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Apellido</label>
                    <input type="text" className={`input-field ${step1Errors.surname ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Pérez" value={surname} onChange={e => setSurname(e.target.value)} autoComplete="family-name" />
                    {step1Errors.surname && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{step1Errors.surname}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Contraseña</label>
                  <input type="password" className={`input-field ${step1Errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                  {step1Errors.password
                    ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{step1Errors.password}</p>
                    : <p className="mt-1 text-xs text-stone-400">Mínimo 8 caracteres</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Confirmar contraseña</label>
                  <input type="password" className={`input-field ${step1Errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Repetí tu contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                  {step1Errors.confirmPassword && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{step1Errors.confirmPassword}</p>}
                </div>

                <button type="button" onClick={handleStep1Next} className="btn btn-primary w-full mt-2">
                  Siguiente
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: Currencies ──────────────────────────────────────────── */}
          {step === 2 && (
            <>
              <div className="flex items-start justify-between mb-1">
                <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">¿Qué monedas usás?</h1>
                <button type="button" onClick={skip} className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 mt-1">
                  Omitir
                </button>
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">Podés agregar más desde la app</p>

              {recommendations === null ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  {currencyOptions.map(opt => (
                    <SelectionCard
                      key={opt.id}
                      label={opt.name}
                      code={opt.symbol}
                      selected={selectedCurrencyIds.includes(opt.id)}
                      onClick={() => toggleCurrency(opt.id)}
                    />
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={goBack} className="btn btn-secondary flex-1">Atrás</button>
                <button type="button" onClick={goNext} className="btn btn-primary flex-1">Siguiente</button>
              </div>
            </>
          )}

          {/* ── Step 3: Banks / wallets ─────────────────────────────────────── */}
          {step === 3 && (
            <>
              <div className="flex items-start justify-between mb-1">
                <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">¿Dónde tenés cuenta?</h1>
                <button type="button" onClick={skip} className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 mt-1">
                  Omitir
                </button>
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">Seleccioná tus bancos y billeteras</p>

              {recommendations === null ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mb-6 max-h-72 overflow-y-auto pr-1">
                  {recommendations.entities.map(e => (
                    <SelectionCard
                      key={e.id}
                      label={e.name}
                      iconUrl={e.iconUrl}
                      selected={selectedEntityIds.includes(e.id)}
                      onClick={() => toggleEntity(e.id)}
                    />
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={goBack} className="btn btn-secondary flex-1">Atrás</button>
                <button type="button" onClick={goNext} className="btn btn-primary flex-1">Siguiente</button>
              </div>
            </>
          )}

          {/* ── Step 4: Payment methods ─────────────────────────────────────── */}
          {step === 4 && (
            <>
              <div className="flex items-start justify-between mb-1">
                <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">¿Cómo pagás?</h1>
                <button type="button" onClick={skip} className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 mt-1">
                  Omitir
                </button>
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">Seleccioná tus métodos de pago</p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mb-6 max-h-72 overflow-y-auto pr-1">
                {filteredPms.length === 0 ? (
                  <p className="col-span-2 text-sm text-stone-400 dark:text-stone-500 text-center py-4">
                    No hay métodos sugeridos para los bancos seleccionados.
                  </p>
                ) : (
                  filteredPms.map(pm => (
                    <SelectionCard
                      key={pm.id}
                      label={pm.name}
                      iconUrl={pm.iconUrl}
                      selected={selectedPmIds.includes(pm.id)}
                      onClick={() => togglePm(pm.id)}
                    />
                  ))
                )}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={goBack} className="btn btn-secondary flex-1" disabled={loading}>Atrás</button>
                <button type="button" onClick={handleSubmit} className="btn btn-primary flex-1" disabled={loading}>
                  {loading ? 'Creando cuenta...' : 'Confirmar'}
                </button>
              </div>
            </>
          )}

        </div>

        {step === 1 && (
          <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-4">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="font-medium text-stone-900 dark:text-stone-100 hover:underline">
              Iniciá sesión
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
