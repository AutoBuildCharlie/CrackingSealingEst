/* ================================================================
   PAVEMENTSCAN — Service Worker v2
   ================================================================ */

const CACHE = 'pavementscan-v2';
const APP_SHELL = [
  '/PavementScan/mobile.html',
  '/PavementScan/mobile.css',
  '/PavementScan/mobile.js',
];

// Install — cache only local files, never block on external URLs
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(APP_SHELL.map(url => cache.add(url)))
    )
  );
  self.skipWaiting();
});

// Activate — clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — only cache local app files, let everything else go to network
self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (e.request.method !== 'GET') return;

  // Always use network for external APIs
  if (
    url.includes('maps.googleapis.com') ||
    url.includes('workers.dev') ||
    url.includes('overpass-api.de') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com')
  ) return;

  // Local app shell — serve from cache, update in background
  if (APP_SHELL.some(s => url.includes(s))) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const networkFetch = fetch(e.request).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        }).catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});
