/* O cache contém somente arquivos públicos. Dados de atletas sempre usam a rede. */
const CACHE_PREFIX = 'r10tri-publico-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const OFFLINE_PAGE = '/offline.html';
const PUBLIC_FILES = [OFFLINE_PAGE, '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(PUBLIC_FILES.map(async (path) => {
      const request = new Request(new URL(path, self.location.origin), { credentials: 'omit', cache: 'reload' });
      const response = await fetch(request);
      if (!response.ok || response.redirected || response.type === 'opaque') throw new Error('Arquivo público indisponível.');
      await cache.put(path, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname === '/api' || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    // Não persiste HTML, cookies, rotas autenticadas ou páginas de primeiro acesso.
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(OFFLINE_PAGE)) || new Response('Sem conexão. Reconecte para acessar seus treinos.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }));
    return;
  }

  if (!url.search && PUBLIC_FILES.includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(url.pathname)) || fetch(request);
    })());
  }
});
