// ===================== SERVICE WORKER — FarmLedger PWA =====================

const CACHE_NAME = 'farmledger-cache-v4';
const ASSETS = [
  './',
  './index.html',
  './login.html',
  './register.html',
  './manifest.json',
  './js/app.js',
  './js/auth.js',
  './js/crops.js',
  './js/dashboard.js',
  './js/database.js',
  './js/expenses.js',
  './js/export.js',
  './js/helpers.js',
  './js/modals.js',
  './js/sales.js',
  './js/state.js',
  './js/udhari.js',
  './js/spray.js',
  './js/weather.js',
  './css/auth.css',
  './css/components.css',
  './css/layout.css',
  './css/pages.css',
  './css/variables.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png'
];

// Install — pre-cache all project assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch — serve from cache first, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // network error / offline fallback
      });
    })
  );
});
