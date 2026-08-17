import { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const DISMISSED_KEY = 'pwa-banner-dismissed-at';
const DISMISS_TTL_DAYS = 30;

function wasDismissedRecently(): boolean {
  const raw = localStorage.getItem(DISMISSED_KEY);
  if (!raw) return false;
  const dismissedAt = parseInt(raw, 10);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Date.now() - dismissedAt < DISMISS_TTL_DAYS * msPerDay;
}

// iOS share icon (Safari's native share button shape)
function IOSShareIcon() {
  return (
    <svg className="inline w-5 h-5 mb-0.5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function AndroidMenuIcon() {
  return (
    <svg className="inline w-4 h-4 mb-0.5 text-stone-600 dark:text-stone-300" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

function IOSInstructions() {
  return (
    <ol className="mt-3 space-y-2 text-sm text-stone-600 dark:text-stone-300">
      <li className="flex gap-2">
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 text-xs flex items-center justify-center font-bold text-stone-700 dark:text-stone-200">1</span>
        <span>Toca el botón de compartir <IOSShareIcon /> en la barra inferior de Safari</span>
      </li>
      <li className="flex gap-2">
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 text-xs flex items-center justify-center font-bold text-stone-700 dark:text-stone-200">2</span>
        <span>Desplazate hacia abajo y toca <strong className="text-stone-800 dark:text-stone-100">"Agregar a pantalla de inicio"</strong></span>
      </li>
      <li className="flex gap-2">
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 text-xs flex items-center justify-center font-bold text-stone-700 dark:text-stone-200">3</span>
        <span>Toca <strong className="text-stone-800 dark:text-stone-100">"Agregar"</strong> para confirmar</span>
      </li>
    </ol>
  );
}

function AndroidInstructions({ nativeAvailable, onNativePrompt }: { nativeAvailable: boolean; onNativePrompt: () => void }) {
  if (nativeAvailable) {
    return (
      <div className="mt-3">
        <p className="text-sm text-stone-600 dark:text-stone-300 mb-3">
          Tu navegador soporta instalación directa. Toca el botón para agregar SpendWise a tu pantalla de inicio.
        </p>
        <button
          onClick={onNativePrompt}
          className="w-full py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-semibold active:scale-95 transition-transform"
        >
          Instalar SpendWise
        </button>
      </div>
    );
  }

  return (
    <ol className="mt-3 space-y-2 text-sm text-stone-600 dark:text-stone-300">
      <li className="flex gap-2">
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 text-xs flex items-center justify-center font-bold text-stone-700 dark:text-stone-200">1</span>
        <span>Toca el menú <AndroidMenuIcon /> en la esquina superior derecha de Chrome</span>
      </li>
      <li className="flex gap-2">
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 text-xs flex items-center justify-center font-bold text-stone-700 dark:text-stone-200">2</span>
        <span>Toca <strong className="text-stone-800 dark:text-stone-100">"Agregar a pantalla de inicio"</strong></span>
      </li>
      <li className="flex gap-2">
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 text-xs flex items-center justify-center font-bold text-stone-700 dark:text-stone-200">3</span>
        <span>Toca <strong className="text-stone-800 dark:text-stone-100">"Agregar"</strong> para confirmar</span>
      </li>
    </ol>
  );
}

function BothInstructions({ nativeAvailable, onNativePrompt }: { nativeAvailable: boolean; onNativePrompt: () => void }) {
  const [tab, setTab] = useState<'ios' | 'android'>('android');
  return (
    <div className="mt-3">
      <div className="flex rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 text-sm">
        <button
          onClick={() => setTab('android')}
          className={`flex-1 py-1.5 font-medium transition-colors ${tab === 'android' ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900' : 'text-stone-500 dark:text-stone-400'}`}
        >
          Android
        </button>
        <button
          onClick={() => setTab('ios')}
          className={`flex-1 py-1.5 font-medium transition-colors ${tab === 'ios' ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900' : 'text-stone-500 dark:text-stone-400'}`}
        >
          iPhone / iPad
        </button>
      </div>
      {tab === 'ios'
        ? <IOSInstructions />
        : <AndroidInstructions nativeAvailable={nativeAvailable} onNativePrompt={onNativePrompt} />
      }
    </div>
  );
}

export default function PWAInstallBanner() {
  const { isStandalone, isMobileBrowser, os, nativePromptAvailable, triggerNativePrompt } = usePWAInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isStandalone && isMobileBrowser && !wasDismissedRecently()) {
      // Small delay so it doesn't flash immediately on load
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, [isStandalone, isMobileBrowser]);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={dismiss}
      />

      {/* Sheet */}
      <div className="fixed bottom-16 left-3 right-3 z-50 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-900 dark:bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white dark:text-stone-900 font-bold text-sm">SW</span>
            </div>
            <div>
              <p className="font-semibold text-stone-900 dark:text-stone-50 leading-tight">Instalar SpendWise</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Acceso rápido desde tu pantalla de inicio</p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors flex-shrink-0"
            aria-label="Cerrar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instructions by OS */}
        {os === 'ios' && <IOSInstructions />}
        {os === 'android' && (
          <AndroidInstructions nativeAvailable={nativePromptAvailable} onNativePrompt={triggerNativePrompt} />
        )}
        {os === 'unknown' && (
          <BothInstructions nativeAvailable={nativePromptAvailable} onNativePrompt={triggerNativePrompt} />
        )}

        {/* Dismiss link */}
        <button
          onClick={dismiss}
          className="mt-4 w-full text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
        >
          Ahora no
        </button>
      </div>
    </>
  );
}
