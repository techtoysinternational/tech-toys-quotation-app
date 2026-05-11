// Tech Toys Quotation System — service worker
// Strategy: stale-while-revalidate for app shell + same-origin GETs.
// Firebase API calls (firestore.googleapis.com) always go to the network
// so live sync stays real-time.
//
// Bump CACHE_VERSION whenever you want all installed PWAs to drop their
// caches and re-fetch on next visit.
const CACHE_VERSION = 'v3';
const CACHE_NAME = `techtoys-${CACHE_VERSION}`;
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return; // POST/PUT etc. pass through untouched

  const url = new URL(req.url);

  // Never cache Firebase API calls — they need real-time round trips.
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('identitytoolkit.googleapis.com')) {
    return; // let the browser handle it directly
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);

    // Kick off a background refresh whether or not we had a hit.
    const networkPromise = fetch(req).then(resp => {
      // Only cache successful responses (including opaque, status 0)
      if (resp && (resp.status === 200 || resp.status === 0)) {
        cache.put(req, resp.clone()).catch(()=>{});
      }
      return resp;
    }).catch(() => null);

    // Serve from cache instantly if we have it; otherwise wait for the network.
    return cached || (await networkPromise) || new Response('Offline', {status: 503});
  })());
});
