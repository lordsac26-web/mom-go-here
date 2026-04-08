/**
 * Service Worker registration and inline SW code.
 * Caches static assets and scripture API responses for offline use.
 */

const SW_CODE = `
const CACHE_NAME = 'momgohere-v1';
const STATIC_CACHE = 'momgohere-static-v1';
const API_CACHE = 'momgohere-api-v1';

// Core static assets to precache on install
const PRECACHE_URLS = [
  '/',
];

// Install: precache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Strategy for scripture API calls: network-first with cache fallback
  if (url.pathname.includes('/getScripture') || url.pathname.includes('/getDailyVerse')) {
    event.respondWith(networkFirstWithCache(event.request, API_CACHE));
    return;
  }

  // Strategy for leaderboard/scores: network-first with cache fallback  
  if (url.pathname.includes('/getLeaderboardScores')) {
    event.respondWith(networkFirstWithCache(event.request, API_CACHE));
    return;
  }

  // Strategy for static assets (JS, CSS, images, fonts): cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstWithNetwork(event.request, STATIC_CACHE));
    return;
  }

  // Strategy for navigation requests: network-first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstWithCache(event.request, STATIC_CACHE));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirstWithCache(event.request, STATIC_CACHE));
});

function isStaticAsset(url) {
  return /\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/.test(url.pathname) ||
    url.hostname === 'media.base44.com' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';
}

async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Return cached root as fallback for navigation
    const fallback = await caches.match('/');
    if (fallback) return fallback;
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // For navigation, return cached root
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/');
      if (fallback) return fallback;
    }
    return new Response(
      JSON.stringify({ error: 'You are offline. Cached content may be available.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
`;

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
    return;
  }

  // Create SW from inline code using Blob URL
  const blob = new Blob([SW_CODE], { type: 'application/javascript' });
  const swUrl = URL.createObjectURL(blob);

  navigator.serviceWorker
    .register(swUrl, { scope: '/' })
    .then((registration) => {
      console.log('[SW] Registered with scope:', registration.scope);

      // Check for updates periodically (every 30 min)
      setInterval(() => {
        registration.update();
      }, 30 * 60 * 1000);
    })
    .catch((err) => {
      // Blob URL registration may fail due to scope restrictions in some browsers.
      // This is expected — the app still works fine without it.
      console.log('[SW] Registration skipped:', err.message);
    });
}