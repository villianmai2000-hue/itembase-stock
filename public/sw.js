const CACHE = "itembase-v4";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // Never intercept API requests, page navigation, or HTML files
  if (
    url.pathname.startsWith("/api/") || 
    e.request.mode === 'navigate' || 
    url.pathname.endsWith('.html') || 
    url.pathname === '/'
  ) {
    return;
  }

  // Uploaded images: cache-first with network fallback
  if (url.pathname.startsWith("/uploads/")) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const fresh = await fetch(e.request);
        cache.put(e.request, fresh.clone());
        return fresh;
      }).catch(() => fetch(e.request))
    );
    return;
  }

  // Static hashed assets (JS/CSS): network-first, fallback to cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});


