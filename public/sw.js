/**
 * Service Worker — production only (dev mode skips registration).
 *
 * Strategy:
 *  - JS / CSS / Vite chunks  → Network-first (never serve stale React/Zustand)
 *  - Images / fonts          → Cache-first (safe to cache)
 *  - HTML navigation          → Network-first with offline fallback
 */

const CACHE_NAME = "momgohere-v3";
const OFFLINE_HTML = "/index.html";

// Patterns that must NEVER be served from cache
const NEVER_CACHE = [
  /\/node_modules\/.vite\//,
  /\/@vite\//,
  /\/@react-refresh/,
  /\/src\//,
  /\.js(\?|$)/,
  /\.jsx(\?|$)/,
  /\.ts(\?|$)/,
  /\.tsx(\?|$)/,
  /\.css(\?|$)/,
];

function shouldSkipCache(url) {
  return NEVER_CACHE.some((re) => re.test(url));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_HTML))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  // Only handle GET
  if (request.method !== "GET") return;

  // JS/CSS/Vite chunks — always network, never cache
  if (shouldSkipCache(url)) {
    event.respondWith(fetch(request));
    return;
  }

  // Images & fonts — cache-first
  if (/\.(png|jpg|jpeg|gif|svg|webp|woff2?|ttf|eot|ico)(\?|$)/.test(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML navigation — network-first, fallback to cached index.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_HTML))
    );
    return;
  }

  // Everything else — network-first
  event.respondWith(fetch(request));
});
