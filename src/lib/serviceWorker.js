/**
 * Service Worker registration.
 * The actual SW logic lives in /public/sw.js.
 */

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
    return;
  }

  // Never run a service worker in dev/preview — it caches stale Vite chunks
  // and causes null-dispatcher React hook crashes.
  if (import.meta.env.DEV) {
    // Unregister any previously cached dev SW so stale caches are cleared
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    return;
  }

  navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      console.log('[SW] Registered with scope:', registration.scope);

      // Check for updates periodically (every 30 min)
      setInterval(() => {
        registration.update();
      }, 30 * 60 * 1000);
    })
    .catch((err) => {
      console.warn('[SW] Registration failed:', err.message);
    });
}