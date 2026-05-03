/**
 * Service Worker registration and inline SW code.
 * Caches static assets and scripture API responses for offline use.
 */

const SW_CODE = `
const CACHE_VERSION = 'v2';
const STATIC_CACHE = 'momgohere-static-' + CACHE_VERSION;
const API_CACHE = 'momgohere-api-' + CACHE_VERSION;
const IMAGE_CACHE = 'momgohere-images-' + CACHE_VERSION;

const PRECACHE_URLS = ['/'];

// Install: precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: purge old versioned caches
self.addEventListener('activate', (event) => {
  const keep = [STATIC_CACHE, API_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => !keep.includes(n)).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch handler ────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  // 1. Backend functions (scripture, verses, leaderboards): network-first
  if (url.pathname.includes('/getScripture') ||
      url.pathname.includes('/getDailyVerse') ||
      url.pathname.includes('/getLeaderboardScores') ||
      url.pathname.includes('/progressiveJackpot')) {
    event.respondWith(networkFirst(event.request, API_CACHE));
    return;
  }

  // 2. Entity API calls (list, filter): network-first with cache
  if (url.pathname.includes('/entities/') && event.request.method === 'GET') {
    event.respondWith(networkFirst(event.request, API_CACHE));
    return;
  }

  // 3. External images (Unsplash, media.base44, OpenStreetMap tiles): cache-first
  if (isImageAsset(url)) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
    return;
  }

  // 4. Static assets (JS, CSS, fonts): cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // 5. Navigation: network-first, fall back to cached app shell
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, STATIC_CACHE));
    return;
  }

  // 6. Everything else: network-first
  event.respondWith(networkFirst(event.request, STATIC_CACHE));
});

// ─── Helpers ──────────────────────────────────────────────────
function isStaticAsset(url) {
  return /\\.(js|css|woff2?|ttf|eot)$/.test(url.pathname) ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';
}

function isImageAsset(url) {
  return /\\.(png|jpg|jpeg|gif|svg|ico|webp)$/.test(url.pathname) ||
    url.hostname === 'media.base44.com' ||
    url.hostname === 'images.unsplash.com' ||
    url.hostname.includes('tile.openstreetmap.org');
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const shell = await caches.match('/');
      if (shell) return shell;
    }
    return new Response(
      JSON.stringify({ error: 'Offline' }),
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