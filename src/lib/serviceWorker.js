/**
 * Service Worker registration.
 * The actual SW logic lives in /public/sw.js.
 */

// Patterns that must NEVER be served from SW cache
const NEVER_CACHE_PATTERNS = [
  '/src/', '/node_modules/.vite', '/@vite', '/@react-refresh',
  '.js', '.jsx', '.ts', '.tsx', '.css',
];

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // In DEV: unregister all SWs and nuke all caches to prevent stale chunk issues
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    return;
  }

  navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      console.log('[SW] Registered with scope:', registration.scope);
      setInterval(() => registration.update(), 30 * 60 * 1000);
    })
    .catch((err) => {
      console.warn('[SW] Registration failed:', err.message);
    });
}