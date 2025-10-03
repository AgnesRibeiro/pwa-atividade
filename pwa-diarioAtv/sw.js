// sw.js
const CACHE_NAME = 'pwa-simple-shell-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  // assets do Leaflet (CDN) — cacheamos CSS/JS para carregar offline
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Evento de instalação: abre o cache e adiciona os assets principais (app shell)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Evento de ativação: limpa caches antigos para evitar conflitos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => {
        if (k !== CACHE_NAME) {
          return caches.delete(k);
        }
      })
    ))
  );
  self.clients.claim();
});

// Evento de fetch: intercepta requisições de rede
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Sempre passar direto para tiles do OpenStreetMap (não cachear)
  if (url.hostname.includes('tile.openstreetmap.org') || url.hostname.includes('a.tile.openstreetmap.org') || url.hostname.includes('b.tile.openstreetmap.org') || url.hostname.includes('c.tile.openstreetmap.org')) {
    return event.respondWith(fetch(event.request));
  }

  // Não cachear chamadas para APIs externas (ex: Nominatim) — responde da rede
  if (url.hostname.includes('nominatim.openstreetmap.org')) {
    return event.respondWith(fetch(event.request));
  }

  // Estratégia "Cache-first" para recursos do app shell
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        if (event.request.method === 'GET' && event.request.url.startsWith(self.location.origin)) {
          return caches.open(CACHE_NAME).then(cache => {
            try { cache.put(event.request, networkResponse.clone()); } catch(e) { /* ignore opaque responses */ }
            return networkResponse;
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      return caches.match('/index.html');
    })
  );
});
