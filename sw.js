/**
 * SERVICE WORKER — MESA INTERATIVA DE RPG EVREN (PWA)
 * Habilita funcionamento 100% offline, caching inteligente e instalação como aplicativo nativo.
 */

const CACHE_NAME = 'evren-vtt-v2.0.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './world_data.json',
  './assets/favicon.svg',
  './assets/favicon-32.png',
  './assets/apple-touch-icon.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable.png',
  './assets/world_countries.js',
  './styles/leaflet.css',
  './styles/glitch.css',
  './styles/main.css',
  './styles/map.css',
  './styles/clouds.css',
  './styles/drawer.css',
  './styles/sheets.css',
  './styles/atmospheric.css',
  './styles/tokens.css',
  './styles/combat-arena.css',
  './styles/initiative-tracker.css',
  './styles/paranormal-oracle.css',
  './styles/session-journal.css',
  './styles/fog-of-war.css',
  './styles/character-creator.css',
  './styles/mda-tree.css',
  './styles/soundboard.css',
  './styles/backup-manager.css',
  './styles/campaign-creator.css',
  './styles/campaigns-hub.css',
  './scripts/leaflet.js',
  './scripts/data-loader.js',
  './scripts/particles.js',
  './scripts/cloud-warp.js',
  './scripts/battlemap-tokens.js',
  './scripts/combat-arena.js',
  './scripts/initiative-tracker.js',
  './scripts/paranormal-oracle.js',
  './scripts/session-journal.js',
  './scripts/fog-of-war.js',
  './scripts/character-creator.js',
  './scripts/mda-tree.js',
  './scripts/soundboard.js',
  './scripts/backup-manager.js',
  './scripts/campaign-creator.js',
  './scripts/map-engine.js',
  './scripts/ui-controller.js',
  './scripts/radar-widget.js',
  './scripts/app.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('✓ [ServiceWorker] Precaching app shell...');
      // Usar individualmente com catch para não quebrar caso algum asset opcional falte
      return Promise.all(
        PRECACHE_ASSETS.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn(`[ServiceWorker] Não foi possível cachear ${url}:`, err);
          });
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`✓ [ServiceWorker] Removendo cache legado: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Ignora requisições que não sejam GET ou esquemas não suportados (ex: chrome-extension)
  if (event.request.method !== 'GET' || !requestUrl.protocol.startsWith('http')) {
    return;
  }

  // Estratégia Stale-While-Revalidate para world_data.json
  if (requestUrl.pathname.endsWith('world_data.json')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Estratégia Cache-First para demais arquivos
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback offline caso o recurso falhe
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
