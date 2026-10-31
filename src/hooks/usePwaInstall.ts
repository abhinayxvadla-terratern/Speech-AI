import { useState, useEffect } from 'react';

declare global {
  interface Window {
    __speechAiDeferredPrompt?: any;
  }
}

// Global listener to capture beforeinstallprompt early as soon as the module loads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    window.__speechAiDeferredPrompt = e;
  });
  window.addEventListener('appinstalled', () => {
    localStorage.setItem('speechai_app_installed', 'true');
    window.__speechAiDeferredPrompt = null;
  });
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      return window.__speechAiDeferredPrompt || null;
    }
    return null;
  });

  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      localStorage.getItem('speechai_app_installed') === 'true'
    );
  });
  const [showInstructionsModal, setShowInstructionsModal] = useState<boolean>(false);

  useEffect(() => {
    // Check standalone mode dynamically
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://') ||
        localStorage.getItem('speechai_app_installed') === 'true';

      if (standalone) {
        setIsInstalled(true);
      }
    };

    checkStandalone();

    if (window.__speechAiDeferredPrompt) {
      setDeferredPrompt(window.__speechAiDeferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.__speechAiDeferredPrompt = e;
      setDeferredPrompt(e);

      // Do NOT revert isInstalled to false if already installed / standalone
      const alreadyInstalled =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://') ||
        localStorage.getItem('speechai_app_installed') === 'true';

      if (!alreadyInstalled) {
        setIsInstalled(false);
      }
    };

    const handleAppInstalled = () => {
      localStorage.setItem('speechai_app_installed', 'true');
      window.__speechAiDeferredPrompt = null;
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    const promptEvent = deferredPrompt || window.__speechAiDeferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      try {
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          localStorage.setItem('speechai_app_installed', 'true');
          setIsInstalled(true);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
      window.__speechAiDeferredPrompt = null;
      setDeferredPrompt(null);
    } else {
      setShowInstructionsModal(true);
    }
  };

  const isIOS =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  return {
    isInstalled,
    isStandalone: isInstalled,
    hasNativePrompt: Boolean(deferredPrompt),
    isIOS,
    isDismissed: isInstalled,
    isBannerDismissed: isInstalled,
    showIOSModal: showInstructionsModal,
    setShowIOSModal: setShowInstructionsModal,
    installApp,
    promptInstall: installApp,
    dismissBanner: () => {},
    dismissHomeBanner: () => {},
    showInstructionsModal,
    setShowInstructionsModal,
  };
}

export const usePWAInstall = usePwaInstall;
