const CACHE_NAME = 'unicorn-donut-dash-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/game.js',
  '/src/input.js',
  '/src/player.js',
  '/src/enemy.js',
  '/src/platform.js',
  '/src/level.js',
  '/src/collectible.js',
  '/src/projectile.js',
  '/src/player_bullet.js',
  '/src/hud.js',
  '/src/ui.js',
  '/src/audio.js',
  '/src/api_client.js',
  '/src/virtual-joystick.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('Cache install failed:', err);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  const accept = req.headers.get('accept') || '';
  const isApi = url.pathname.startsWith('/api/') || accept.includes('application/json');

  if (isApi) {
    // Network-first for API; don't cache
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  event.respondWith(
    caches.match(req)
      .then((response) => {
        if (response) return response;
        const fetchRequest = req.clone();
        return fetch(fetchRequest).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => { cache.put(req, responseToCache); });
          return response;
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
