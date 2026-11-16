import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import bcrypt from 'bcryptjs';
import * as credentials from '../lib/auth-credentials';
import * as resets from '../lib/password-reset';
import { sendPasswordResetEmail, smtpConfiguration } from '../lib/auth-mail';

const root = fileURLToPath(new URL('..', import.meta.url));
const nativeRequire = createRequire(import.meta.url);
const secret = () => randomBytes(24).toString('base64url');
type Handler = { POST: (request: Request) => Promise<Response> };
type SendMail = (to: string, url: string) => Promise<void>;

// Os handlers são os arquivos reais; só as fronteiras de banco e envio externo são controladas.
function handler(file: string, prisma: any, { mailReady = true, sendMail = async () => {} }: { mailReady?: boolean; sendMail?: SendMail } = {}): Handler {
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const sandboxModule = { exports: {} };
  const dependencies: Record<string, unknown> = {
    'next/server': { NextResponse: { json: (body: unknown, options?: ResponseInit) => Response.json(body, options) } },
    '@/lib/db': { prisma },
    '@/lib/auth-credentials': credentials,
    '@/lib/password-reset': resets,
    '@/lib/auth-policy': { configuredAppOrigin: () => 'https://app.example' },
    '@/lib/auth-mail': { recoveryMailConfigured: () => mailReady, sendPasswordResetEmail: sendMail },
  };
  vm.runInNewContext(source, {
    module: sandboxModule, exports: sandboxModule.exports,
    require: (name: string) => name in dependencies ? dependencies[name] : nativeRequire(name),
    Response, URL, URLSearchParams, Buffer, Date, console: { error: () => {} },
  }, { filename: file });
  return sandboxModule.exports as Handler;
}

function request(body: unknown) {
  return new Request('https://app.example/api/teste', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

function recoveryDatabase() {
  const user = { id: 'atleta-temporario', email: 'atleta@example.invalid', username: 'atleta-temporario', authVersion: 0, password: secret() };
  let records: Array<{ identifier: string; token: string; expires: Date }> = [];
  let queue: Promise<unknown> = Promise.resolve();
  const prisma: any = {
    user: {
      findMany: async ({ where }: any) => {
        const matches = where.email ? where.email.equals === user.email : where.username.equals === user.username;
        return matches ? [{ ...user }] : [];
      },
      updateMany: async ({ where, data }: any) => {
        if (where.id !== user.id) return { count: 0 };
        user.password = data.password;
        user.authVersion += data.authVersion.increment;
        return { count: 1 };
      },
    },
    verificationToken: {
      findFirst: async ({ where }: any) => records.filter(record => record.identifier === where.identifier).sort((a, b) => b.expires.getTime() - a.expires.getTime())[0] ?? null,
      findUnique: async ({ where }: any) => records.find(record => record.identifier === where.identifier_token.identifier && record.token === where.identifier_token.token) ?? null,
      create: async ({ data }: any) => { records.push({ ...data }); return data; },
      deleteMany: async ({ where }: any) => {
        const before = records.length;
        records = records.filter(record => !(record.identifier === where.identifier && (!where.token || record.token === where.token) && (!where.expires || record.expires > where.expires.gt)));
        return { count: before - records.length };
      },
    },
    $transaction: async (callback: (database: any) => Promise<unknown>) => {
      const result = queue.then(async () => {
        const beforeRecords = records.map(record => ({ ...record }));
        const beforeUser = { ...user };
        try { return await callback(prisma); }
        catch (error) { records = beforeRecords; Object.assign(user, beforeUser); throw error; }
      });
      queue = result.then(() => undefined, () => undefined);
      return result;
    },
  };
  return { prisma, user, records: () => records, add: (record: typeof records[number]) => records.push(record) };
}

test('identificadores normalizam caixa e espaços, sem inventar usuários ou aceitar campos inválidos', () => {
  assert.deepEqual(credentials.loginLookup(' Atleta@Example.COM '), { kind: 'email', value: 'atleta@example.com' });
  assert.deepEqual(credentials.loginLookup(' R10ADM '), { kind: 'username', value: 'r10adm' });
  for (const value of [null, 1, {}, '', 'usuario com espaço', 'nome@', '@example.com']) assert.equal(credentials.loginLookup(value), null);
});

test('bcrypt aceita senha UTF-8 com espaços e não trata trim da senha como equivalente', async () => {
  const password = ` ${secret()}Áç `;
  const record = { id: 'temporario', name: null, email: 'atleta@example.invalid', role: 'atleta', authVersion: 0, password: await bcrypt.hash(password, 12) };
  const find = async (lookup: credentials.LoginLookup) => { assert.equal(lookup.value, 'atleta@example.invalid'); return [record]; };
  assert.equal((await credentials.authenticateCredentials({ email: ' ATLETA@EXAMPLE.INVALID ', password }, find))?.id, record.id);
  assert.equal(await credentials.authenticateCredentials({ email: record.email, password: password.trim() }, find), null);
});

test('usuário atribuído à conta funciona sem vincular nomes fixos a outras contas', async () => {
  const password = secret();
  const record = { id: 'coach-temporario', name: null, email: 'coach@example.invalid', role: 'coach', authVersion: 0, password: await bcrypt.hash(password, 12) };
  const find = async (lookup: credentials.LoginLookup) => lookup.kind === 'username' && lookup.value === 'coach-temporario' ? [record] : [];
  assert.equal((await credentials.authenticateCredentials({ username: ' COACH-TEMPORARIO ', password }, find))?.id, record.id);
  assert.equal(await credentials.authenticateCredentials({ username: 'R10ADM', password }, find), null);
});

test('colisões legadas e contas sem senha não são escolhidas arbitrariamente', async () => {
  const password = secret();
  const record = { id: 'temporario', name: null, email: 'atleta@example.invalid', role: 'atleta', authVersion: 0, password: await bcrypt.hash(password, 12) };
  assert.equal(await credentials.authenticateCredentials({ email: record.email, password }, async () => [record, { ...record, id: 'outro' }]), null);
  assert.equal(await credentials.authenticateCredentials({ email: record.email, password }, async () => [{ ...record, password: null }]), null);
  assert.equal(await credentials.authenticateCredentials({ email: record.email, password }, async () => [{ ...record, password: 'hash-inválido' }]), null);
});

test('troca de versão revoga sessões antigas e mantém compatibilidade com sessões anteriores à migração', () => {
  assert.equal(credentials.sessionVersionMatches(undefined, 0), true);
  assert.equal(credentials.sessionVersionMatches(0, 0), true);
  assert.equal(credentials.sessionVersionMatches(0, 1), false);
  assert.equal(credentials.sessionVersionMatches(undefined, 1), false);
  assert.equal(credentials.sessionVersionMatches(1, 1), true);
});

test('recuperação gera 256 bits aleatórios, hash persistido e URL sem token na consulta', () => {
  const first = resets.createPasswordReset('conta-temporaria', new Date('2026-11-14T12:00:00Z'));
  const second = resets.createPasswordReset('conta-temporaria');
  assert.match(first.token, /^[a-f0-9]{64}$/);
  assert.ok(first.token !== second.token && first.token !== first.record.token);
  assert.equal(first.record.expires.toISOString(), '2026-11-14T12:30:00.000Z');
  const url = new URL(resets.passwordResetUrl('https://app.example', 'conta-temporaria', first.token));
  assert.equal(url.search, '');
  assert.equal(new URLSearchParams(url.hash.slice(1)).get('conta'), 'conta-temporaria');
  assert.ok(new URLSearchParams(url.hash.slice(1)).get('token') === first.token);
});

test('SMTP ausente ou configuração inválida não dispara envio; transporte controlado recebe e-mail seguro', async () => {
  assert.equal(smtpConfiguration({}), null);
  assert.equal(smtpConfiguration({ SMTP_HOST: 'smtp.example', SMTP_FROM: 'remetente@example.invalid', SMTP_PORT: 'inválida' }), null);
  const env = { SMTP_HOST: 'smtp.example', SMTP_FROM: 'remetente@example.invalid', SMTP_USER: 'teste-sintetico', SMTP_PASSWORD: secret(), SMTP_PORT: '465', SMTP_SECURE: 'true' };
  let sent = 0;
  const reset = resets.createPasswordReset('temporario');
  const url = resets.passwordResetUrl('https://app.example', 'temporario', reset.token);
  await sendPasswordResetEmail('atleta@example.invalid', url, { env, sender: async message => {
    sent++;
    assert.equal(message.to, 'atleta@example.invalid');
    assert.ok(message.text.includes(url));
    assert.ok(message.html.includes('30 minutos'));
    assert.equal(Object.prototype.hasOwnProperty.call(message, 'auth'), false);
  } });
  assert.equal(sent, 1);
});

test('API de recuperação informa SMTP indisponível antes de consultar uma conta', async () => {
  const route = handler('app/api/auth/forgot-password/route.ts', { user: { findMany: async () => { throw new Error('Consulta indevida'); } } }, { mailReady: false });
  const response = await route.POST(request({ identifier: 'atleta@example.invalid' }));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'RECOVERY_UNAVAILABLE');
});

test('solicitação usa a mesma mensagem para contas existentes e ausentes, sem link ou token; reenvio tem intervalo', async () => {
  const db = recoveryDatabase();
  let sent = 0;
  let capturedUrl = '';
  const route = handler('app/api/auth/forgot-password/route.ts', db.prisma, { sendMail: async (_to, url) => { sent++; capturedUrl = url; } });
  const first = await route.POST(request({ identifier: db.user.username }));
  const known = await first.json();
  const unknown = await route.POST(request({ identifier: 'inexistente@example.invalid' }));
  assert.equal(first.status, 200);
  assert.deepEqual(await unknown.json(), known);
  assert.deepEqual(Object.keys(known), ['message']);
  await route.POST(request({ identifier: db.user.email }));
  assert.equal(sent, 1);
  assert.equal(db.records().length, 1);
  const rawToken = new URLSearchParams(new URL(capturedUrl).hash.slice(1)).get('token');
  assert.ok(rawToken && db.records()[0].token !== rawToken);
});

test('solicitações concorrentes não multiplicam e-mails dentro do intervalo', async () => {
  const db = recoveryDatabase();
  let sent = 0;
  const route = handler('app/api/auth/forgot-password/route.ts', db.prisma, { sendMail: async () => { sent++; } });
  const responses = await Promise.all([route.POST(request({ identifier: db.user.email })), route.POST(request({ identifier: db.user.email }))]);
  assert.ok(responses.every(response => response.status === 200));
  assert.equal(sent, 1);
});

test('redefinição exige token válido e não aceita token adulterado ou expirado', async () => {
  const db = recoveryDatabase();
  const reset = resets.createPasswordReset(db.user.id, new Date(0));
  db.add(reset.record);
  const originalPassword = db.user.password;
  const route = handler('app/api/auth/reset-password/route.ts', db.prisma);
  for (const token of [undefined, randomBytes(32).toString('hex'), reset.token]) {
    const response = await route.POST(request({ userId: db.user.id, token, password: secret() }));
    assert.equal(response.status, 400);
    assert.ok(db.user.password === originalPassword);
    assert.equal(db.user.authVersion, 0);
  }
});

test('redefinição consome token uma vez, salva hash e revoga sessões anteriores', async () => {
  const db = recoveryDatabase();
  const reset = resets.createPasswordReset(db.user.id);
  db.add(reset.record);
  const password = ` ${secret()}ç `;
  const route = handler('app/api/auth/reset-password/route.ts', db.prisma);
  const response = await route.POST(request({ userId: db.user.id, token: reset.token, password }));
  assert.equal(response.status, 200);
  assert.equal(await bcrypt.compare(password, db.user.password), true);
  assert.equal(await bcrypt.compare(password.trim(), db.user.password), false);
  assert.equal(db.user.authVersion, 1);
  assert.equal(db.records().length, 0);
  assert.equal((await route.POST(request({ userId: db.user.id, token: reset.token, password: secret() }))).status, 400);
  assert.equal(db.user.authVersion, 1);
});

test('dois usos concorrentes de um token mudam a senha apenas uma vez', async () => {
  const db = recoveryDatabase();
  const reset = resets.createPasswordReset(db.user.id);
  db.add(reset.record);
  const route = handler('app/api/auth/reset-password/route.ts', db.prisma);
  const responses = await Promise.all([route.POST(request({ userId: db.user.id, token: reset.token, password: secret() })), route.POST(request({ userId: db.user.id, token: reset.token, password: secret() }))]);
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 400]);
  assert.equal(db.user.authVersion, 1);
});
