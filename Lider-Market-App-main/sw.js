// Service Worker v4 — no cachea HTML; red primero en navegaciones
const CACHE = 'lm-v4';

// Solo assets estáticos; NO ponemos index.html aquí.
const CORE_ASSETS = [
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './gesture-update.js',
  './admin-tabs.js',   // ok si lleva ?v=...; el SW igual lo refresca
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE_ASSETS)).catch(()=>null)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE) ? caches.delete(k) : Promise.resolve()));
    const clientsArr = await self.clients.matchAll({ type: 'window' });
    clientsArr.forEach(c => c.postMessage({ type: 'UPDATE_READY' }));
  })());
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 1) Para páginas (navegaciones): red primero, sin cachear HTML
  const isPage = req.mode === 'navigate' || req.destination === 'document';
  if (isPage) {
    event.respondWith(
      fetch(req).catch(() =>
        new Response(
          '<!doctype html><meta charset="utf-8"><title>Sin conexión</title>' +
          '<style>body{font-family:sans-serif;padding:2rem}</style>' +
          '<h1>Sin conexión</h1><p>Vuelve a intentarlo cuando tengas Internet.</p>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        )
      )
    );
    return;
  }

  // 2) Para assets del mismo origen: "stale-while-revalidate"
  const sameOrigin = new URL(req.url).origin === location.origin;
  if (sameOrigin) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      const net = fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => cached);
      return cached || net;
    })());
  }
});
