// ============================================================
//  Service Worker
//  Core app files: network-first, so deployed updates show up
//  on the next launch. Cache is the offline fallback.
//  Images/icons: cache-first (they rarely change).
// ============================================================

const CACHE_NAME = 'nutritrack-v6';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './config.js',
  './data/foods.js',
  './manifest.webmanifest',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
];

// Install: cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function cachePut(request, response) {
  if (response && response.status === 200 && response.type === 'basic') {
    const clone = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
  }
  return response;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isCore = url.origin === self.location.origin &&
    (event.request.mode === 'navigate' ||
     /\.(?:js|css|html|webmanifest)$/.test(url.pathname) ||
     url.pathname.endsWith('/'));

  if (isCore) {
    // Network-first: always try to get the freshest app code
    event.respondWith(
      fetch(event.request)
        .then(res => cachePut(event.request, res))
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first for images and other static media
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(res => cachePut(event.request, res))
      )
    );
  }
});
