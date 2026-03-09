import { useState, useEffect, useRef } from 'react';

type MobileOS = 'ios' | 'android' | 'unknown';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
  isStandalone: boolean;
  isMobileBrowser: boolean;
  os: MobileOS;
  nativePromptAvailable: boolean;
  triggerNativePrompt: () => Promise<void>;
}

function detectOS(): MobileOS {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'unknown';
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  );
}

function isMobileBrowser(): boolean {
  const os = detectOS();
  if (os === 'ios' || os === 'android') return true;
  return /mobi|tablet/i.test(navigator.userAgent);
}

export function usePWAInstall(): PWAInstallState {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [nativePromptAvailable, setNativePromptAvailable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setNativePromptAvailable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerNativePrompt = async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setNativePromptAvailable(false);
  };

  return {
    isStandalone: isStandalone(),
    isMobileBrowser: isMobileBrowser(),
    os: detectOS(),
    nativePromptAvailable,
    triggerNativePrompt,
  };
}
