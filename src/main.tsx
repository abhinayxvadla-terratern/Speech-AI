import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-update
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New version available, updating...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] App shell precached and ready for offline use.');
  },
  onRegistered(r) {
    console.log('[PWA] Service worker registered successfully:', r?.scope);
  },
  onRegisterError(error) {
    console.warn('[PWA] Service worker registration failed:', error);
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
