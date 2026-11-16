#!/usr/bin/env node
// Testa somente contas aleatórias em PostgreSQL isolado. Não apaga registros.
// Sem certificados: usa o servidor local existente e comprova a indisponibilidade SMTP.
// Com AUTH_RECOVERY_TLS_CERT/KEY: abre SMTP TLS de teste e um Next de produção próprio.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer as createNetServer } from 'node:net';
import { createServer as createTlsServer } from 'node:tls';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const nativeRequire = createRequire(import.meta.url);
const prisma = new PrismaClient({ log: [] });
const secret = () => randomBytes(24).toString('base64url');
const hash = token => createHash('sha256').update(token).digest('hex');
const nonce = randomBytes(12).toString('hex');
const identity = { email: `recuperacao-${nonce}@example.invalid`, username: `recuperacao-${nonce}`, password: ` ${secret()}Áç ` };
const scenarios = [];
let passed = 0;
let base;
let app;
let smtp;
let mailbox;
let smtpMode = false;

async function check(name, run) { scenarios.push(name); await run(); passed++; }
const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

function client() {
  const jar = new Map();
  return {
    async request(path, { method = 'GET', body, form } = {}) {
      const response = await fetch(new URL(path, base), {
        method, redirect: 'manual', signal: AbortSignal.timeout(30_000),
        headers: {
          cookie: [...jar].map(([key, value]) => `${key}=${value}`).join('; '),
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
          ...(form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        ...(form ? { body: new URLSearchParams(form) } : {}),
      });
      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(';')[0]; const equals = pair.indexOf('=');
        if (equals > 0) jar.set(pair.slice(0, equals), pair.slice(equals + 1));
      }
      let data;
      try { data = await response.json(); } catch { data = null; }
      return { status: response.status, data, location: response.headers.get('location') || '' };
    },
  };
}

async function login(identifier, password, field = 'email') {
  const browser = client();
  const csrf = await browser.request('/api/auth/csrf');
  assert.equal(csrf.status, 200);
  const response = await browser.request('/api/auth/callback/credentials', { method: 'POST', form: { csrfToken: csrf.data.csrfToken, [field]: identifier, password } });
  const session = await browser.request('/api/auth/session');
  return { browser, response, session: session.data };
}

async function freePort() {
  const server = createNetServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

async function smtpFixture(certPath, keyPath) {
  const messages = [];
  const sockets = new Set();
  const username = `fixture-${nonce}`;
  const password = secret();
  const server = createTlsServer({ cert: readFileSync(certPath), key: readFileSync(keyPath), minVersion: 'TLSv1.2' }, socket => {
    sockets.add(socket);
    socket.setEncoding('utf8');
    socket.on('close', () => sockets.delete(socket));
    socket.on('error', () => {});
    socket.write('220 fixture.example.invalid ESMTP\r\n');
    let buffer = ''; let collecting = false; let message = ''; let authenticated = false; let authStage = ''; let loginUser = '';
    const authenticate = (user, pass) => { authenticated = user === username && pass === password; socket.write(authenticated ? '235 Autenticado\r\n' : '535 Não autorizado\r\n'); };
    socket.on('data', data => {
      buffer += data;
      if (buffer.length > 128_000) { socket.destroy(); return; }
      let separator;
      while ((separator = buffer.indexOf('\r\n')) >= 0) {
        const line = buffer.slice(0, separator); buffer = buffer.slice(separator + 2);
        if (collecting) {
          if (line === '.') { messages.push(message); message = ''; collecting = false; socket.write('250 Mensagem recebida pela fixture\r\n'); }
          else message += `${line.startsWith('..') ? line.slice(1) : line}\r\n`;
          continue;
        }
        if (authStage === 'plain') { const parts = Buffer.from(line, 'base64').toString('utf8').split('\0'); authenticate(parts[1], parts[2]); authStage = ''; continue; }
        if (authStage === 'user') { loginUser = Buffer.from(line, 'base64').toString('utf8'); authStage = 'password'; socket.write('334 UGFzc3dvcmQ6\r\n'); continue; }
        if (authStage === 'password') { authenticate(loginUser, Buffer.from(line, 'base64').toString('utf8')); authStage = ''; continue; }
        if (/^(EHLO|HELO) /i.test(line)) socket.write('250-fixture.example.invalid\r\n250-AUTH PLAIN LOGIN\r\n250 SIZE 128000\r\n');
        else if (/^AUTH PLAIN/i.test(line)) {
          const payload = line.split(' ')[2];
          if (payload) { const parts = Buffer.from(payload, 'base64').toString('utf8').split('\0'); authenticate(parts[1], parts[2]); }
          else { authStage = 'plain'; socket.write('334 \r\n'); }
        } else if (/^AUTH LOGIN/i.test(line)) { authStage = 'user'; socket.write('334 VXNlcm5hbWU6\r\n'); }
        else if (/^MAIL FROM:/i.test(line)) socket.write(authenticated ? '250 Remetente aceito\r\n' : '530 Autenticação necessária\r\n');
        else if (/^RCPT TO:/i.test(line)) socket.write(authenticated && /@example\.invalid>/i.test(line) ? '250 Destinatário de teste aceito\r\n' : '550 Apenas destinatários de teste\r\n');
        else if (/^DATA$/i.test(line) && authenticated) { collecting = true; socket.write('354 Envie a mensagem\r\n'); }
        else if (/^QUIT$/i.test(line)) socket.end('221 Encerrado\r\n');
        else socket.write('250 OK\r\n');
      }
    });
  });
  server.on('tlsClientError', () => {});
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { messages, username, password, port: server.address().port, close: async () => { for (const socket of sockets) socket.destroy(); await new Promise(resolve => server.close(resolve)); } };
}

function resetLink(message) {
  const quotedPrintable = text => text.replace(/=\r?\n/g, '').replace(/=([a-f0-9]{2})/gi, (_match, value) => String.fromCharCode(parseInt(value, 16)));
  const candidates = [quotedPrintable(message)];
  for (const part of message.split(/\r\n--/)) {
    if (/Content-Transfer-Encoding: base64/i.test(part)) {
      const body = part.slice(part.indexOf('\r\n\r\n') + 4).trim();
      candidates.push(Buffer.from(body, 'base64').toString('utf8'));
    }
  }
  for (const text of candidates) {
    const match = text.match(/http:\/\/127\.0\.0\.1:\d+\/redefinir-senha#[^\s<"]+/);
    if (match) return new URL(match[0]);
  }
  throw new Error('Mensagem da fixture sem link de recuperação.');
}

try {
  const database = new URL(process.env.DATABASE_URL || '');
  assert.equal(database.hostname, '127.0.0.1');
  assert.ok(['r10tri_test', 'r10tri_ci'].includes(database.pathname.slice(1)));
  assert.ok(!process.env.ABACUSAI_API_KEY && !process.env.WEB_APP_ID && !process.env.NOTIF_ID_BOASVINDAS_AO_ATLETA);
  const certPath = process.env.AUTH_RECOVERY_TLS_CERT;
  const keyPath = process.env.AUTH_RECOVERY_TLS_KEY;
  smtpMode = Boolean(certPath && keyPath);
  if (smtpMode) {
    smtp = await smtpFixture(certPath, keyPath);
    mailbox = smtp.messages;
    base = new URL(`http://127.0.0.1:${await freePort()}`);
    // A CA adicional existe apenas no processo filho que se conecta à fixture TLS.
    app = spawn(process.execPath, [nativeRequire.resolve('next/dist/bin/next'), 'start', '--port', base.port, '--hostname', '127.0.0.1'], {
      cwd: process.cwd(), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_EXTRA_CA_CERTS: certPath, NEXT_DIST_DIR: process.env.AUTH_RECOVERY_DIST_DIR || '.build', NEXTAUTH_URL: base.origin, APP_ORIGIN: base.origin, NEXT_TELEMETRY_DISABLED: '1', SMTP_HOST: '127.0.0.1', SMTP_PORT: String(smtp.port), SMTP_SECURE: 'true', SMTP_FROM: 'remetente@example.invalid', SMTP_USER: smtp.username, SMTP_PASSWORD: smtp.password },
    });
    // Consome a saída sem publicar logs que possam conter dados de requisições.
    app.stdout.on('data', () => {}); app.stderr.on('data', () => {});
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      if (app.exitCode !== null) throw new Error('Servidor de teste encerrou durante a inicialização.');
      try { if ((await fetch(new URL('/api/auth/providers', base))).ok) { ready = true; break; } } catch {}
      await pause(500);
    }
    assert.ok(ready);
  } else {
    assert.ok(!process.env.SMTP_HOST, 'O teste HTTP simples exige SMTP não configurado para impedir envio externo.');
    base = new URL(process.env.AUTH_RECOVERY_BASE || 'http://localhost:3000');
    assert.ok(['localhost', '127.0.0.1'].includes(base.hostname) && base.protocol === 'http:');
  }

  let userId;
  let originalSession;
  let token;
  let newPassword;
  await check('cadastro-normaliza-email-e-preserva-senha', async () => {
    const response = await client().request('/api/signup', { method: 'POST', body: { email: ` ${identity.email.toUpperCase()} `, password: identity.password, name: 'Conta temporária de autenticação' } });
    assert.equal(response.status, 201); userId = response.data.id;
    const record = await prisma.user.findUnique({ where: { id: userId } });
    assert.ok(record.email === identity.email);
    assert.equal(await bcrypt.compare(identity.password, record.password), true);
    const assigned = await prisma.user.updateMany({ where: { id: userId, email: identity.email, username: null }, data: { username: identity.username } });
    assert.equal(assigned.count, 1);
  });
  await check('login-email-ignora-caixa-e-espacos', async () => {
    const result = await login(` ${identity.email.toUpperCase()} `, identity.password);
    assert.ok(result.session?.user?.id === userId); originalSession = result.browser;
  });
  await check('login-username-real-sem-escalar-permissoes', async () => {
    const result = await login(` ${identity.username.toUpperCase()} `, identity.password, 'username');
    assert.ok(result.session?.user?.id === userId); assert.equal(result.session.user.role, 'atleta');
  });
  await check('senha-nao-sofre-trim', async () => { assert.ok(!(await login(identity.email, identity.password.trim())).session?.user); });
  await check(smtpMode ? 'smtp-tls-entrega-link-sem-expor-token-na-api' : 'smtp-ausente-usa-mesma-resposta-para-contas-existentes-e-ausentes', async () => {
    const response = await client().request('/api/auth/forgot-password', { method: 'POST', body: { identifier: ` ${identity.username.toUpperCase()} ` } });
    const unknown = await client().request('/api/auth/forgot-password', { method: 'POST', body: { identifier: `inexistente-${nonce}@example.invalid` } });
    assert.equal(response.status, smtpMode ? 200 : 503);
    assert.deepEqual(response.data, unknown.data);
    if (smtpMode) {
      assert.deepEqual(Object.keys(response.data), ['message']);
      assert.equal(mailbox.length, 1);
      const link = resetLink(mailbox[0]);
      assert.equal(link.origin, base.origin); assert.equal(link.search, '');
      const fragment = new URLSearchParams(link.hash.slice(1));
      assert.ok(fragment.get('conta') === userId); token = fragment.get('token');
      const stored = await prisma.verificationToken.findUnique({ where: { identifier_token: { identifier: `redefinir-senha:${userId}`, token: hash(token) } } });
      assert.ok(stored && stored.token !== token);
      await client().request('/api/auth/forgot-password', { method: 'POST', body: { identifier: identity.email } });
      assert.equal(mailbox.length, 1);
    } else {
      token = randomBytes(32).toString('hex');
      // Simula a posse de um link somente na conta criada pelo próprio teste.
      await prisma.verificationToken.create({ data: { identifier: `redefinir-senha:${userId}`, token: hash(token), expires: new Date(Date.now() + 30 * 60 * 1000) } });
    }
  });
  await check('token-adulterado-e-expirado-nao-alteram-senha', async () => {
    const expired = randomBytes(32).toString('hex');
    await prisma.verificationToken.create({ data: { identifier: `redefinir-senha:${userId}`, token: hash(expired), expires: new Date(0) } });
    for (const invalid of [randomBytes(32).toString('hex'), expired]) {
      const response = await client().request('/api/auth/reset-password', { method: 'POST', body: { userId, token: invalid, password: secret() } });
      assert.equal(response.status, 400);
    }
    const record = await prisma.user.findUnique({ where: { id: userId } });
    assert.equal(record.authVersion, 0);
    assert.equal(await bcrypt.compare(identity.password, record.password), true);
  });
  await check('reset-real-atualiza-hash-e-versao', async () => {
    newPassword = ` ${secret()}ç `;
    const response = await client().request('/api/auth/reset-password', { method: 'POST', body: { userId, token, password: newPassword } });
    assert.equal(response.status, 200);
    const record = await prisma.user.findUnique({ where: { id: userId } });
    assert.equal(record.authVersion, 1);
    assert.equal(await bcrypt.compare(newPassword, record.password), true);
    assert.equal(await bcrypt.compare(identity.password, record.password), false);
  });
  await check('reset-revoga-sessao-anterior', async () => { assert.ok(!(await originalSession.request('/api/auth/session')).data?.user); });
  await check('novo-login-funciona-e-senha-anterior-falha', async () => {
    assert.ok((await login(identity.username, newPassword)).session?.user?.id === userId);
    assert.ok(!(await login(identity.email, identity.password)).session?.user);
  });
  await check('link-consumido-nao-pode-ser-reutilizado', async () => {
    const response = await client().request('/api/auth/reset-password', { method: 'POST', body: { userId, token, password: secret() } });
    assert.equal(response.status, 400);
    assert.equal((await prisma.user.findUnique({ where: { id: userId } })).authVersion, 1);
  });
  console.log(JSON.stringify({ modo: smtpMode ? 'smtp-local-tls' : 'http-sem-smtp', cenarios: scenarios.length, aprovados: passed, falhas: 0, contasTemporarias: 1 }));
} catch (error) {
  // Não registra corpos HTTP, mensagens de e-mail, endereços, links, cookies ou credenciais.
  console.error(JSON.stringify({ modo: smtpMode ? 'smtp-local-tls' : 'http-sem-smtp', cenarios: scenarios.length, aprovados: passed, falhas: 1, cenarioComFalha: scenarios.at(-1) || 'configuracao', tipoDoErro: error?.name, ...(typeof error?.actual === 'number' ? { valorObtido: error.actual } : {}), ...(typeof error?.expected === 'number' ? { valorEsperado: error.expected } : {}), ...(typeof error?.cause?.code === 'string' ? { codigo: error.cause.code } : {}) }));
  process.exitCode = 1;
} finally {
  if (app && app.exitCode === null) app.kill();
  if (smtp) await smtp.close();
  await prisma.$disconnect();
}
