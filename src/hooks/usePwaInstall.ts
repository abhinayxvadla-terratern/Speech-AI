import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Module-level variable so early event is not missed
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    notifyListeners();
  });
}

export function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function checkIsIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(ua) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
  );
}

const STORAGE_KEY_BANNER_DISMISSED = 'speechai_pwa_banner_dismissed';

export function usePwaInstall() {
  const [isStandalone, setIsStandalone] = useState<boolean>(() => checkIsStandalone());
  const [hasDeferredPrompt, setHasDeferredPrompt] = useState<boolean>(() => Boolean(globalDeferredPrompt));
  const [isIOS] = useState<boolean>(() => checkIsIOS());
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY_BANNER_DISMISSED) === 'true';
  });

  useEffect(() => {
    const handleUpdate = () => {
      setHasDeferredPrompt(Boolean(globalDeferredPrompt));
      setIsStandalone(checkIsStandalone());
    };

    listeners.add(handleUpdate);

    // Watch display-mode media query
    const mql = window.matchMedia('(display-mode: standalone)');
    const handleMqlChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches || checkIsStandalone());
    };

    if (mql.addEventListener) {
      mql.addEventListener('change', handleMqlChange);
    } else {
      mql.addListener(handleMqlChange);
    }

    return () => {
      listeners.delete(handleUpdate);
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handleMqlChange);
      } else {
        mql.removeListener(handleMqlChange);
      }
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (isStandalone) {
      return false;
    }

    if (globalDeferredPrompt) {
      try {
        await globalDeferredPrompt.prompt();
        const choice = await globalDeferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          globalDeferredPrompt = null;
          setHasDeferredPrompt(false);
          setIsStandalone(true);
          return true;
        }
      } catch (err) {
        console.warn('PWA install prompt error:', err);
      }
      return false;
    }

    if (isIOS) {
      setShowIOSModal(true);
      return false;
    }

    return false;
  }, [isStandalone, isIOS]);

  const dismissHomeBanner = useCallback(() => {
    setIsBannerDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY_BANNER_DISMISSED, 'true');
    } catch {}
  }, []);

  return {
    isStandalone,
    canInstall: !isStandalone && (hasDeferredPrompt || isIOS),
    hasNativePrompt: Boolean(globalDeferredPrompt),
    isIOS,
    showIOSModal,
    setShowIOSModal,
    promptInstall,
    isBannerDismissed,
    dismissHomeBanner,
  };
}
