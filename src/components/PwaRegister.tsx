'use client';

import { useEffect } from 'react';

/** Registra o service worker para instalar como PWA. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        // Atualiza SW em background quando houver nova versão
        reg.update().catch(() => {});
      } catch {
        /* ignore */
      }
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
