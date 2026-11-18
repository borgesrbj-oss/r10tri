#!/usr/bin/env node
// Integração real e não destrutiva. Execute somente com o servidor e o PostgreSQL isolados.
// As contas e credenciais são aleatórias; os registros de teste permanecem no banco.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { Decoder, Stream } from '@garmin/fitsdk';
import JSZip from 'jszip';

let base;
try {
  base = new URL(process.env.INTEGRATION_SMOKE_BASE || 'http://localhost:3000');
  const database = new URL(process.env.DATABASE_URL || '');
  assert.ok(['localhost', '127.0.0.1'].includes(base.hostname) && base.protocol === 'http:' && !base.username && !base.password);
  assert.ok(['postgres:', 'postgresql:'].includes(database.protocol));
  assert.equal(database.hostname, '127.0.0.1');
  assert.ok(['r10tri_test', 'r10tri_ci'].includes(database.pathname.slice(1)));
  // O servidor deve usar este mesmo ambiente isolado, sem envio externo de e-mails.
  assert.ok(!process.env.ABACUSAI_API_KEY && !process.env.WEB_APP_ID && !process.env.NOTIF_ID_BOASVINDAS_AO_ATLETA);
} catch {
  // Configuração recusada antes de abrir conexão; nem URLs inválidas são exibidas.
  console.error(JSON.stringify({ cenarios: 0, aprovados: 0, falhas: 1, cenarioComFalha: 0 }));
  process.exit(1);
}

const prisma = new PrismaClient({ log: [] });
const nonce = randomBytes(12).toString('hex');
const freshIdentity = (suffix) => ({
  email: `integracao-${nonce}-${suffix}@example.invalid`,
  password: randomBytes(24).toString('base64url'),
  name: 'Conta temporária de integração',
});
const identities = { atletaA: freshIdentity('a'), atletaB: freshIdentity('b'), coach: freshIdentity('coach'), convite: freshIdentity('convite') };
let passed = 0;
let scenario = 0;
const scenarioNames = [
  'acesso-sem-sessao',
  'cadastro-isolado',
  'login-e-permissoes',
  'convite-restrito-ao-coach',
  'avaliacao-do-atleta',
  'geracao-e-listagem-do-plano',
  'alteracao-alheia-bloqueada',
  'registro-alheio-bloqueado',
  'vinculo-com-plano-alheio-bloqueado',
  'registro-proprio-conclui-treino',
  'registro-alheio-existente-bloqueado',
  'chave-de-integracao-nao-e-exposta',
  'convite-real-com-hash-no-banco',
  'convite-invalido-bloqueado',
  'primeiro-acesso-com-convite',
  'convite-consumido-nao-pode-ser-reutilizado',
  'exportacao-alheia-bloqueada',
  'fit-individual-valido',
  'plano-garmin-fit-valido',
  'plano-garmin-tcx-valido',
  'plano-mywhoosh-valido',
  'feedback-isolado-por-atleta',
  'orcamento-diario-em-todas-as-modalidades',
  'edicao-atualiza-blocos-e-preserva-observacao',
];

function client() {
  const jar = new Map();
  return {
    async request(path, { method = 'GET', body, form, binary = false } = {}) {
      const response = await fetch(new URL(path, base), {
        method,
        redirect: 'manual',
        signal: AbortSignal.timeout(60_000),
        headers: {
          cookie: [...jar].map(([key, value]) => `${key}=${value}`).join('; '),
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
          ...(form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        ...(form ? { body: new URLSearchParams(form) } : {}),
      });
      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(';')[0];
        const equals = pair.indexOf('=');
        if (equals > 0) jar.set(pair.slice(0, equals), pair.slice(equals + 1));
      }
      const bytes = binary ? Buffer.from(await response.arrayBuffer()) : null;
      const text = bytes ? '' : await response.text();
      let data;
      try { data = JSON.parse(text); } catch { data = null; }
      return { status: response.status, data, bytes, contentType: response.headers.get('content-type') || '', location: response.headers.get('location') || '' };
    },
  };
}

async function check(run) {
  scenario += 1;
  await run();
  passed += 1;
}

async function register(identity) {
  assert.equal(await prisma.user.count({ where: { email: identity.email } }), 0);
  const response = await client().request('/api/signup', { method: 'POST', body: identity });
  assert.equal(response.status, 201);
  identity.id = response.data.id;
  // Confirma que o servidor HTTP gravou no mesmo banco isolado usado pelo teste.
  const persisted = await prisma.user.findUnique({ where: { id: identity.id } });
  assert.equal(persisted?.email, identity.email);
  assert.equal(persisted?.role, 'atleta');
}

async function login(identity) {
  const browser = client();
  const csrf = await browser.request('/api/auth/csrf');
  assert.equal(csrf.status, 200);
  assert.equal(typeof csrf.data.csrfToken, 'string');
  const result = await browser.request('/api/auth/callback/credentials', {
    method: 'POST', form: { csrfToken: csrf.data.csrfToken, email: identity.email, password: identity.password },
  });
  assert.ok(result.status < 400);
  assert.equal(result.location.includes('error='), false);
  const session = await browser.request('/api/auth/session');
  assert.equal(session.status, 200);
  assert.equal(session.data?.user?.id, identity.id);
  return browser;
}

const denied = (response) => assert.ok([401, 403, 404].includes(response.status));
let atletaA;
let atletaB;
let coach;
let planId;
let workout;
let invitation;
const privateKey = randomBytes(24).toString('base64url');

try {
  await check(async () => {
    for (const path of ['/api/profile', '/api/workouts', '/api/dashboard','/api/training-feedback']) denied(await client().request(path));
  });
  await check(async () => { await register(identities.atletaA); await register(identities.atletaB); await register(identities.coach); });
  await check(async () => {
    // Altera somente uma conta criada nesta execução, nunca uma conta preexistente.
    const changed = await prisma.user.updateMany({ where: { id: identities.coach.id, email: identities.coach.email, role: 'atleta' }, data: { role: 'coach' } });
    assert.equal(changed.count, 1);
    atletaA = await login(identities.atletaA);
    atletaB = await login(identities.atletaB);
    coach = await login(identities.coach);
    assert.equal((await coach.request('/api/auth/session')).data.user.role, 'coach');
    assert.equal((await atletaA.request('/api/auth/session')).data.user.role, 'atleta');
  });
  await check(async () => {
    denied(await atletaA.request('/api/athlete/create', { method: 'POST', body: { email: identities.convite.email } }));
    assert.equal(await prisma.user.count({ where: { email: identities.convite.email } }), 0);
  });
  await check(async () => {
    const response = await atletaA.request('/api/profile/assessment', { method: 'POST', body: { birthDate: '1990-01-01', heightCm:175, dailyMinutes:{seg:45,ter:50,qua:50,qui:50,sex:50,sab:75},strengthAvailable:true, currentWeight: 70, currentWeeklyVol: 5, level: 'intermediario', modality: 'triatlo', weeklyHours: 6, availableDays: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'], canSwim: true, hasPoolAccess: true, ftp: 200, runThresholdPace: '06:00', swimCssPace: '02:10' } });
    assert.equal(response.status, 200);
  });
  await check(async () => {
    const response = await atletaA.request('/api/plan/generate', { method: 'POST', body: { modality: 'triatlo', startDate: '2026-11-16', weeks: 4 } });
    assert.equal(response.status, 200);
    assert.ok(response.data.workoutsCount > 0);
    planId = response.data.planId;
    const workouts = await atletaA.request('/api/workouts');
    assert.equal(workouts.status, 200);
    workout = workouts.data.find((entry) => entry.planId === planId);
    assert.ok(workout?.id);
    assert.ok(workouts.data.every((entry) => entry.userId === identities.atletaA.id));
    assert.ok(workouts.data.every((entry) => entry.structure?.version === 1));
    assert.ok(workouts.data.every((entry) => entry.structure.steps.reduce((sum, step) => sum + step.durationSeconds, 0) === entry.duration * 60));
    assert.equal(response.data.summary.basis, 'tempo_aerobico_ativo');
  });
  await check(async () => {
    denied(await atletaB.request('/api/workouts', { method: 'POST', body: { id: workout.id, title: 'Alteração indevida' } }));
    denied(await atletaB.request('/api/workouts/update', { method: 'POST', body: { id: workout.id, title: 'Alteração indevida' } }));
    const persisted = await prisma.workout.findUnique({ where: { id: workout.id } });
    assert.equal(persisted.title, workout.title);
  });
  await check(async () => {
    denied(await atletaB.request('/api/workouts/log', { method: 'POST', body: { workoutId: workout.id, actualDuration: 30, rpe: 5 } }));
    assert.equal(await prisma.workoutLog.count({ where: { workoutId: workout.id } }), 0);
    assert.equal((await prisma.workout.findUnique({ where: { id: workout.id } })).completed, false);
  });
  await check(async () => {
    const body = { planId, title: 'Treino em plano alheio', date: '2026-11-16T12:00:00.000Z', modality: 'corrida', duration: 30 };
    denied(await atletaB.request('/api/workouts', { method: 'POST', body }));
    denied(await atletaB.request('/api/workouts/create', { method: 'POST', body }));
    assert.equal(await prisma.workout.count({ where: { planId, userId: identities.atletaB.id } }), 0);
  });
  await check(async () => {
    const invalid = await atletaA.request('/api/workouts/log', { method: 'POST', body: { workoutId: workout.id, painScore: 11 } });
    assert.equal(invalid.status, 422);
    const response = await atletaA.request('/api/workouts/log', { method: 'POST', body: { workoutId: workout.id, actualDuration: 30, actualDistance: 4, rpe: 5, sleepHours: 8, fatigueScore: 0, painScore: 0 } });
    assert.equal(response.status, 200);
    assert.equal(response.data.userId, identities.atletaA.id);
    assert.equal(response.data.painScore, 0);
    assert.equal(response.data.fatigueScore, 0);
    assert.equal((await prisma.workout.findUnique({ where: { id: workout.id } })).completed, true);
  });
  await check(async () => {
    denied(await atletaB.request('/api/workouts/log', { method: 'POST', body: { workoutId: workout.id, actualDuration: 999, rpe: 10 } }));
    const persisted = await prisma.workoutLog.findUnique({ where: { workoutId: workout.id } });
    assert.equal(persisted.userId, identities.atletaA.id);
    assert.equal(persisted.actualDuration, 30);
  });
  await check(async () => {
    const saved = await atletaA.request('/api/integrations/intervals/save-key', { method: 'POST', body: { apiKey: privateKey } });
    assert.equal(saved.status, 200);
    for (const path of ['/api/profile', '/api/profile/assessment']) {
      const response = await atletaA.request(path);
      assert.equal(response.status, 200);
      assert.equal(Object.hasOwn(response.data, 'intervalsIcuApiKey'), false);
      assert.equal(response.data.hasIntervalsKey, true);
      assert.equal(JSON.stringify(response.data).includes(privateKey), false);
    }
    const response = await atletaA.request('/api/profile', { method: 'POST', body: { nickname: 'Atleta de integração' } });
    assert.equal(response.status, 200);
    assert.equal(Object.hasOwn(response.data, 'intervalsIcuApiKey'), false);
  });
  await check(async () => {
    const response = await coach.request('/api/athlete/create', { method: 'POST', body: { email: identities.convite.email, name: identities.convite.name } });
    assert.equal(response.status, 200);
    identities.convite.id = response.data.id;
    const url = new URL(response.data.invitationUrl);
    const fragment = new URLSearchParams(url.hash.slice(1));
    invitation = { email: identities.convite.email, password: identities.convite.password, token: fragment.get('convite') };
    assert.ok(invitation.token);
    assert.equal(url.origin, base.origin);
    const records = await prisma.verificationToken.findMany({ where: { identifier: { contains: identities.convite.email } } });
    assert.equal(records.length, 1);
    assert.notEqual(records[0].token, invitation.token);
  });
  await check(async () => {
    const invalid = await client().request('/api/auth/set-password', { method: 'POST', body: { ...invitation, token: randomBytes(32).toString('hex') } });
    assert.equal(invalid.status, 400);
    const missing = await client().request('/api/auth/set-password', { method: 'POST', body: { email: invitation.email, password: invitation.password } });
    assert.equal(missing.status, 400);
    assert.equal((await prisma.user.findUnique({ where: { id: identities.convite.id } })).password, null);
  });
  await check(async () => {
    const response = await client().request('/api/auth/set-password', { method: 'POST', body: invitation });
    assert.equal(response.status, 200);
    await login(identities.convite);
  });
  await check(async () => {
    const replay = await client().request('/api/auth/set-password', { method: 'POST', body: { ...invitation, password: randomBytes(24).toString('base64url') } });
    assert.equal(replay.status, 400);
    await login(identities.convite);
  });
  await check(async () => {
    denied(await atletaB.request(`/api/workouts/fit?id=${encodeURIComponent(workout.id)}`));
    denied(await atletaB.request(`/api/plan/export?planId=${encodeURIComponent(planId)}`));
  });
  await check(async () => {
    const response = await atletaA.request(`/api/workouts/fit?id=${encodeURIComponent(workout.id)}`, { binary: true });
    assert.equal(response.status, 200);
    assert.equal(response.contentType, 'application/octet-stream');
    const decoder = new Decoder(Stream.fromByteArray(response.bytes));
    assert.equal(decoder.isFIT(), true);
    assert.equal(decoder.checkIntegrity(), true);
    const decoded = decoder.read();
    assert.deepEqual(decoded.errors, []);
    assert.ok(decoded.messages.workoutStepMesgs.length >= 3);
  });
  for (const { platform, format, extension } of [
    { platform: 'garmin', format: 'fit', extension: '.fit' },
    { platform: 'garmin', format: 'tcx', extension: '.tcx' },
    { platform: 'mywhoosh', format: 'zwo', extension: '.zwo' },
  ]) {
    await check(async () => {
      const query = new URLSearchParams({ planId, platform, format });
      const response = await atletaA.request(`/api/plan/export?${query}`, { binary: true });
      assert.equal(response.status, 200);
      assert.equal(response.contentType, 'application/zip');
      const archive = await JSZip.loadAsync(response.bytes);
      const files = Object.values(archive.files).filter(file => !file.dir);
      assert.ok(files.some(file => file.name.endsWith(extension)));
      assert.ok(files.some(file => file.name === 'COMO_IMPORTAR.txt'));
      assert.equal(files.length, await prisma.workout.count({ where: { planId } }) + 1);
      for (const file of files.filter(entry => entry.name.endsWith(extension))) {
        if (extension === '.fit') {
          const decoder = new Decoder(Stream.fromByteArray(await file.async('nodebuffer')));
          assert.equal(decoder.isFIT(), true);
          assert.equal(decoder.checkIntegrity(), true);
          assert.deepEqual(decoder.read().errors, []);
        } else {
          const xml = await file.async('string');
          assert.ok(xml.startsWith('<?xml'));
          assert.ok(xml.includes(extension === '.tcx' ? '<TrainingCenterDatabase ' : '<workout_file>'));
        }
      }
    });
  }
  await check(async()=>{
    const own=await atletaA.request('/api/training-feedback');
    const other=await atletaB.request('/api/training-feedback');
    assert.equal(own.status,200);assert.equal(own.data.observedSessions,1);assert.equal(other.data.observedSessions,0);
    assert.equal(JSON.stringify(own.data).includes(identities.atletaA.email),false);
    assert.ok(own.data.initialFactor<=1);
  });
  await check(async()=>{
    const all=await atletaA.request('/api/workouts');
    const totals=new Map();for(const item of all.data)totals.set(item.date,(totals.get(item.date)||0)+item.duration);
    for(const [date,minutes] of totals){const day=new Date(date).getUTCDay();assert.ok(minutes<=(day===1?45:day===6?75:50));}
  });
  await check(async()=>{
    const all=await atletaA.request('/api/workouts'),item=all.data.find(entry=>!entry.completed && entry.duration>5);
    const response=await atletaA.request('/api/workouts/update',{method:'POST',body:{id:item.id,duration:item.duration-1,description:'Orientação manual preservada'}});
    assert.equal(response.status,200);const updated=response.data.workout;
    assert.equal(updated.structure.steps.reduce((sum,step)=>sum+step.durationSeconds,0),updated.duration*60);
    assert.equal(updated.structure.requiresCoachReview,true);assert.ok(updated.description.includes('Orientação manual preservada'));
  });
  console.log(JSON.stringify({ cenarios: scenario, aprovados: passed, falhas: 0, contasTemporarias: 4 }));
} catch (error) {
  // Não registra corpos HTTP, links de convite, cookies, senhas ou dados do banco.
  console.error(JSON.stringify({ cenarios: scenario, aprovados: passed, falhas: 1, cenarioComFalha: scenario, nomeDoCenario: scenarioNames[scenario - 1], tipoDoErro: error?.name, ...(typeof error?.actual === 'number' ? { valorObtido: error.actual } : {}), ...(typeof error?.expected === 'number' ? { valorEsperado: error.expected } : {}) }));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
