// Tech Toys Quotation App — auto-update service worker
const CACHE_NAME = 'techtoys-quotation-auto-v3';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Network-first for HTML/JS so GitHub updates show immediately.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith((async () => {
    try {
      const fresh = await fetch(req, { cache: 'no-store' });
      return fresh;
    } catch (e) {
      const cached = await caches.match(req);
      return cached || Response.error();
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
