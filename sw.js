// Bolsas Lucrativas - Service Worker PWA
const CACHE_NAME = 'bolsas-lucrativas-v1.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './index.css',
  './app.js',
  './app-data.js',
  './guia-data.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.png',
  './icons/apple-touch-icon.png',
  './assets/capa-inicio.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Precache partial fail:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore non-http/https or chrome-extension schemes
  if (!url.protocol.startsWith('http')) return;

  // Stale-While-Revalidate for local thumbs and assets
  if (url.origin === self.location.origin && (url.pathname.includes('/assets/') || url.pathname.includes('/icons/'))) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(req).then((cached) => {
          const fetchPromise = fetch(req).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              cache.put(req, networkRes.clone());
            }
            return networkRes;
          }).catch(() => cached);
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // Network first with cache fallback for HTML pages
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req).then((networkRes) => {
        const copy = networkRes.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        return networkRes;
      }).catch(() => {
        return caches.match(req).then((cached) => {
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // Default Cache first, network fallback
  event.respondWith(
    caches.match(req).then((cached) => {
      return cached || fetch(req).then((networkRes) => {
        if (networkRes && networkRes.status === 200 && req.method === 'GET') {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return networkRes;
      }).catch((err) => {
        // Fallback for offline if not found
        return cached;
      });
    })
  );
});
