// Scoped cache for this version; no business data or localStorage is reset.
const CACHE = 'techtoys-owner-sync-email-project-fields-2026-09-15-v4';
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(['./','./index.html','./manifest.webmanifest','./assets/icon-192.png','./assets/icon-512.png']))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(clients.claim()); });
self.addEventListener('message', event => { if(event.data?.type==='SKIP_WAITING')self.skipWaiting(); });
self.addEventListener('fetch', event => {
  if(event.request.method!=='GET' || new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).then(response => {
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request).then(response=>response || (event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
