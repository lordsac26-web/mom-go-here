/**
 * Service Worker — caches only static assets (images, fonts, manifest).
 * JS and CSS chunks are NEVER cached here — Vite handles their versioning
 * via content hashes, and caching them in the SW causes stale React
 * dispatcher crashes on redeployment.
 */

const CACHE_NAME = 'momgohere-v4';

// Only cache truly static, non-JS/CSS assets
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.ico',
];

// Patterns that must always be network-fetched, never cache-first
const BYPASS_PATTERNS = [
  /\/src\//,
  /node_modules/,
  /\/@vite/,
  /\/@react-refresh/,
  /\.js(\?|$)/,
  /\.jsx(\?|$)/,
  /\.ts(\?|$)/,
  /\.tsx(\?|$)/,
  /\.css(\?|$)/,
  /\/api\//,
  /\/functions\//,
];

function shouldBypass(url) {
  return BYPASS_PATTERNS.some((p) => p.test(url));
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Always bypass non-GET and pattern-matched requests
  if (request.method !== 'GET' || shouldBypass(url)) {
    event.respondWith(fetch(request));
    return;
  }

  // Network-first for HTML (ensures fresh app shell)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for images/fonts only
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
