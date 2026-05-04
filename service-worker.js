/* Tech Toys Quotation App — Auto-update service worker
   Network-first: always tries the latest files from GitHub Pages.
   It does NOT keep old index.html stuck in cache. */
const CACHE_NAME = 'techtoys-quotation-auto-v2';
const STATIC_FILES = [
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES)).catch(() => null)
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // HTML/navigation must always be network-first so updates appear immediately.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Other files: network-first, fallback to cache only if offline.
  event.respondWith(
    fetch(req, { cache: 'no-store' }).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => null);
      return res;
    }).catch(() => caches.match(req))
  );
});
