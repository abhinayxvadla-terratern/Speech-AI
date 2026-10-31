import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register modern PWA service worker with immediate auto-update
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[PWA] New version available, reloading to apply updates...');
      updateSW(true);
    },
    onOfflineReady() {
      console.log('[PWA] App ready for offline use.');
    },
    onRegistered(registration) {
      if (registration) {
        // Periodically poll for new deployments every 10 minutes
        setInterval(() => {
          registration.update().catch(() => {});
        }, 10 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('[PWA] Service worker registration error:', error);
    },
  });

  // When user returns to tab, actively check for app updates
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update().catch(() => {});
      }).catch(() => {});
    }
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
