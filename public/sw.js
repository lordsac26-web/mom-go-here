const CACHE_VERSION = 'v3';
const STATIC_CACHE = 'momgohere-static-' + CACHE_VERSION;
const API_CACHE = 'momgohere-api-' + CACHE_VERSION;
const IMAGE_CACHE = 'momgohere-images-' + CACHE_VERSION;

const PRECACHE_URLS = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const keep = [STATIC_CACHE, API_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((name) => !keep.includes(name)).map((name) => caches.delete(name)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  if (url.pathname.includes('/getScripture') ||
      url.pathname.includes('/getDailyVerse') ||
      url.pathname.includes('/getLeaderboardScores') ||
      url.pathname.includes('/progressiveJackpot')) {
    event.respondWith(networkFirst(event.request, API_CACHE));
    return;
  }

  if (url.pathname.includes('/entities/')) {
    event.respondWith(networkFirst(event.request, API_CACHE));
    return;
  }

  if (isImageAsset(url)) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, STATIC_CACHE));
    return;
  }

  event.respondWith(networkFirst(event.request, STATIC_CACHE));
});

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|eot)$/.test(url.pathname) ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';
}

function isImageAsset(url) {
  return /\.(png|jpg|jpeg|gif|svg|ico|webp)$/.test(url.pathname) ||
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
