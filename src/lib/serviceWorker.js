/**
 * Service Worker registration.
 * The actual SW logic lives in /public/sw.js.
 */

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
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