import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

function worker() {
  const listeners = new Map();
  const stores = new Map();
  const network = [];
  const writes = [];
  const lookups = [];
  const removed = [];
  let claimed = false;
  let skipped = false;
  let fetcher = async () => new Response('arquivo público', { status: 200 });
  const cacheStorage = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        async put(path, response) { writes.push({ name, path }); entries.set(path, response.clone()); },
        async match(path) { lookups.push(path); return entries.get(path)?.clone(); },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { removed.push(name); return stores.delete(name); },
  };
  const scope = {
    location: { origin: 'https://r10tri.example' },
    addEventListener(name, callback) { listeners.set(name, callback); },
    async skipWaiting() { skipped = true; },
    clients: { async claim() { claimed = true; } },
  };
  vm.runInNewContext(source, {
    self: scope,
    caches: cacheStorage,
    URL, Request, Response,
    fetch: async (request) => { network.push(request); return fetcher(request); },
  }, { filename: 'public/sw.js' });
  return {
    stores, network, writes, lookups, removed,
    get claimed() { return claimed; },
    get skipped() { return skipped; },
    setFetcher(callback) { fetcher = callback; },
    async lifecycle(name) {
      let completion;
      listeners.get(name)({ waitUntil(promise) { completion = promise; } });
      await completion;
    },
    async request(path, options = {}) {
      const request = { url: new URL(path, scope.location.origin).href, method: 'GET', mode: 'cors', ...options };
      let response;
      let intercepted = false;
      listeners.get('fetch')({ request, respondWith(promise) { intercepted = true; response = promise; } });
      return { request, intercepted, response: await response };
    },
  };
}

test('instalação armazena somente recursos públicos sem enviar credenciais', async () => {
  const sw = worker();
  await sw.lifecycle('install');
  assert.equal(sw.skipped, true);
  assert.ok(sw.writes.length > 0);
  assert.ok(sw.writes.every(({ path }) => /^\/(offline\.html|icon-(192|512)\.png|apple-touch-icon\.png|favicon\.svg)$/.test(path)));
  assert.ok(sw.network.every(request => request.credentials === 'omit' && request.cache === 'reload'));
});

test('ativação atualiza apenas caches públicos da própria aplicação', async () => {
  const sw = worker();
  sw.stores.set('r10tri-publico-antigo', new Map());
  sw.stores.set('outro-aplicativo', new Map([['/dados', new Response('preservar')]]));
  await sw.lifecycle('install');
  await sw.lifecycle('activate');
  assert.deepEqual(sw.removed, ['r10tri-publico-antigo']);
  assert.equal(sw.stores.has('outro-aplicativo'), true);
  assert.equal(sw.claimed, true);
});

test('API, autenticação e mutações nunca são interceptadas pelo cache', async () => {
  const sw = worker();
  for (const path of ['/api/profile', '/api/auth/session', '/api/auth/csrf', '/api/auth/set-password', '/api']) {
    assert.equal((await sw.request(path, { mode: 'navigate' })).intercepted, false);
  }
  assert.equal((await sw.request('/dashboard', { method: 'POST', mode: 'navigate' })).intercepted, false);
  assert.equal(sw.writes.length, 0);
  assert.equal(sw.lookups.length, 0);
});

test('navegação autenticada usa a resposta da rede sem armazenar HTML privado', async () => {
  const sw = worker();
  sw.setFetcher(async () => new Response('conteúdo privado do atleta', { headers: { 'Cache-Control': 'private, no-store' } }));
  const result = await sw.request('/dashboard?plano=privado', { mode: 'navigate' });
  assert.equal(await result.response.text(), 'conteúdo privado do atleta');
  assert.equal(sw.network[0], result.request);
  assert.equal(sw.writes.length, 0);
  assert.equal(sw.lookups.length, 0);
});

test('offline retorna uma página neutra sem reutilizar dados do atleta', async () => {
  const sw = worker();
  sw.setFetcher(async request => new Response(new URL(request.url).pathname === '/offline.html' ? 'orientação pública de reconexão' : 'ícone'));
  await sw.lifecycle('install');
  const count = sw.writes.length;
  sw.setFetcher(async () => { throw new TypeError('Sem conexão'); });
  const result = await sw.request('/atletas/privado', { mode: 'navigate' });
  assert.equal(await result.response.text(), 'orientação pública de reconexão');
  assert.deepEqual(sw.lookups, ['/offline.html']);
  assert.equal(sw.writes.length, count);
});

test('falhas HTTP reais não são mascaradas pela tela offline', async () => {
  const sw = worker();
  sw.setFetcher(async () => new Response('acesso negado', { status: 401 }));
  const result = await sw.request('/dashboard', { mode: 'navigate' });
  assert.equal(result.response.status, 401);
  assert.equal(sw.lookups.length, 0);
});

test('cache indisponível em modo offline responde sem dados pessoais e sem cache HTTP', async () => {
  const sw = worker();
  sw.setFetcher(async () => { throw new TypeError('Sem conexão'); });
  const result = await sw.request('/plano', { mode: 'navigate' });
  assert.equal(result.response.status, 503);
  assert.equal(result.response.headers.get('cache-control'), 'no-store');
  assert.ok((await result.response.text()).includes('Reconecte'));
});

test('recursos externos, chunks e parâmetros não entram na lista de cache', async () => {
  const sw = worker();
  for (const path of ['https://externo.example/icon-192.png', '/_next/static/app.js', '/icon-192.png?atleta=privado', '/foto-do-atleta.png']) {
    assert.equal((await sw.request(path)).intercepted, false);
  }
  assert.equal(sw.writes.length, 0);
});

test('ícones públicos podem ser utilizados offline sem cachear outros recursos', async () => {
  const sw = worker();
  await sw.lifecycle('install');
  sw.setFetcher(async () => { throw new TypeError('Sem conexão'); });
  const before = sw.network.length;
  const result = await sw.request('/icon-192.png');
  assert.equal(result.intercepted, true);
  assert.equal(result.response.status, 200);
  assert.equal(sw.network.length, before);
});

test('manifesto declara identidade estável, escopo e ícones PNG com tamanhos reais', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/manifest.json', import.meta.url), 'utf8'));
  assert.equal(manifest.lang, 'pt-BR');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.id, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.start_url, '/');
  for (const size of [192, 512]) {
    const icon = manifest.icons.find(entry => entry.sizes === `${size}x${size}` && entry.type === 'image/png');
    assert.ok(icon);
    const bytes = readFileSync(new URL(`../public${icon.src}`, import.meta.url));
    assert.equal(bytes.readUInt32BE(16), size);
    assert.equal(bytes.readUInt32BE(20), size);
  }
});
