const CACHE_NAME = 'spendwise-v1';

// Al instalar: activar inmediatamente sin esperar que se cierren las tabs viejas
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Al activar: borrar cachés de versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Requests a otros dominios (backend, APIs externas, Google Fonts):
  // dejar pasar a la red sin interceptar
  if (url.hostname !== self.location.hostname) {
    return;
  }

  // Navegación (rutas de React Router): red primero, fallback a index.html
  // Así funciona offline mostrando la app aunque no haya conexión
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Assets estáticos (JS, CSS, imágenes, fuentes del mismo origen):
  // cache-first para carga instantánea
  if (
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    event.request.destination === 'image' ||
    event.request.destination === 'font' ||
    event.request.destination === 'manifest'
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
