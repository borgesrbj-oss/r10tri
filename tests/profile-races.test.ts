import { refreshFutureBikeTargets } from '../lib/workout-reassessment';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import * as assessment from '../lib/assessment-validation';
import * as triathlon from '../lib/triathlon-race';
import { publicProfile } from '../lib/profile-public';

const root = fileURLToPath(new URL('..', import.meta.url));
const nativeRequire = createRequire(import.meta.url);
type Session = { user: { id: string; role?: string } } | null;
type Handler = { POST: (request: Request) => Promise<Response>; GET: () => Promise<Response> };

// Exercita os handlers reais, trocando somente sessão e persistência por fronteiras controladas.
function handler(file: string, prisma: unknown, session: Session = { user: { id: 'atleta-atual' } }): Handler {
  const db=prisma as any;db.$transaction??=async (run:any)=>run(db);
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const sandboxModule = { exports: {} };
  const dependencies: Record<string, unknown> = {
    '@/lib/workout-reassessment':{refreshFutureBikeTargets},
    'next/server': { NextResponse: { json: (body: unknown, options?: ResponseInit) => Response.json(body, options) } },
    '@/auth': { auth: async () => session },
    '@/lib/db': { prisma },
    '@/lib/assessment-validation': assessment,
    '@/lib/triathlon-race': triathlon,
    '@/lib/profile-public': { publicProfile },
  };
  vm.runInNewContext(source, {
    module: sandboxModule, exports: sandboxModule.exports,
    require: (name: string) => name in dependencies ? dependencies[name] : nativeRequire(name),
    Response, Date,
  }, { filename: file });
  return sandboxModule.exports as Handler;
}

const request = (body: unknown) => new Request('https://app.example/api/teste', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
const raceInput = { name: ' Prova de referência ', date: '2027-04-05', distance: '42k', notes: ' Objetivo confirmado ' };

test('prova só pode ser editada pelo proprietário, inclusive quando outro usuário é coach', async () => {
  for (const role of ['atleta', 'coach']) {
    const stored = { id: 'prova-de-outro', userId: 'outro-atleta', ...raceInput };
    let attempts = 0;
    const route = handler('app/api/races/route.ts', { targetRace: {
      update: async ({ where, data }: any) => {
        attempts++;
        assert.equal(where.id, stored.id);
        assert.equal(where.userId, 'atleta-atual');
        if (where.userId !== stored.userId) throw { code: 'P2025' };
        return Object.assign(stored, data);
      },
    } }, { user: { id: 'atleta-atual', role } });
    const response = await route.POST(request({ id: stored.id, ...raceInput, name: 'Tentativa de alteração' }));
    assert.equal(response.status, 404);
    assert.equal(attempts, 1);
    assert.equal(stored.name, raceInput.name);
    assert.deepEqual(await response.json(), { error: 'Prova não encontrada.' });
  }
});

test('edição da própria prova mantém os dados e a condição de propriedade na gravação', async () => {
  const route = handler('app/api/races/route.ts', { targetRace: {
    update: async ({ where, data }: any) => {
      assert.equal(where.id, 'minha-prova');
      assert.equal(where.userId, 'atleta-atual');
      assert.equal(data.name, 'Prova de referência');
      assert.equal(data.date.toISOString(), '2027-04-05T12:00:00.000Z');
      assert.equal(data.notes, 'Objetivo confirmado');
      assert.equal(data.userId, undefined);
      return { id: where.id, userId: where.userId, ...data };
    },
  } });
  const response = await route.POST(request({ id: 'minha-prova', ...raceInput, userId: 'outro-atleta' }));
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.equal(saved.userId, 'atleta-atual');
  assert.equal(saved.distance, '42k');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('cadastro preserva distâncias personalizadas, datas históricas e formato ISO do contrato anterior', async () => {
  let creates = 0;
  const route = handler('app/api/races/route.ts', { targetRace: {
    create: async ({ data }: any) => { creates++; return { id: `prova-${creates}`, ...data }; },
  } });
  for (const date of ['2020-06-01', '2020-06-01T09:30:00-03:00']) {
    const response = await route.POST(request({ name: 'Prova histórica', date, distance: 'Travessia 3 km', userId: 'outro-atleta' }));
    assert.equal(response.status, 201);
    const saved = await response.json();
    assert.equal(saved.userId, 'atleta-atual');
    assert.equal(saved.distance, 'Travessia 3 km');
  }
  assert.equal(creates, 2);
});

test('provas recusam JSON inválido, campos obrigatórios vazios e datas impossíveis antes de gravar', async () => {
  const route = handler('app/api/races/route.ts', { targetRace: {
    create: async () => { assert.fail('O payload inválido não pode ser gravado.'); },
    update: async () => { assert.fail('O payload inválido não pode ser gravado.'); },
  } });
  for (const body of [null, [], {}, { ...raceInput, date: '2027-02-30' }, { ...raceInput, date: '2027-02-30T12:00:00Z' }, { ...raceInput, name: ' ' }, { ...raceInput, distance: '' }, { ...raceInput, notes: 42 }]) {
    assert.equal((await route.POST(request(body))).status, 422);
  }
  const malformed = new Request('https://app.example/api/races', { method: 'POST', body: '{' });
  assert.equal((await route.POST(malformed)).status, 400);
});

test('provas exigem sessão e a listagem usa somente o proprietário autenticado', async () => {
  const unauthenticated = handler('app/api/races/route.ts', {}, null);
  assert.equal((await unauthenticated.GET()).status, 401);
  assert.equal((await unauthenticated.POST(request(raceInput))).status, 401);
  const route = handler('app/api/races/route.ts', { targetRace: {
    findMany: async ({ where }: any) => { assert.equal(where.userId, 'atleta-atual'); return []; },
  } });
  const response = await route.GET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
});

test('mudança de meta do atleta preserva as faixas e a confirmação do coach', async () => {
  const selected = { id: 'minha-prova', name: 'Olímpico', userId: 'atleta-atual', date: new Date('2027-04-05T12:00:00Z'), distance: 'olimpico' };
  const segmentTargets = { format: 'olimpico', goalSeconds: 10000, rangeSource: 'Evento oficial', reviewedLevel: 'intermediario', ranges: { t1: { minSeconds: 60, maxSeconds: 300 } } };
  const route = handler('app/api/races/route.ts', { targetRace: {
    findFirst: async ({ where }: any) => {
      assert.equal(where.userId, selected.userId);
      return { ...selected, segmentTargets };
    },
    update: async ({ where, data }: any) => {
      assert.equal(where.id, selected.id);
      assert.equal(where.userId, selected.userId);
      return { ...selected, ...data };
    },
  } });
  const input = { name: selected.name, date: '2027-04-05', distance: 'olimpico', id: selected.id, segmentTargets: { goalSeconds: 10200 } };
  const response = await route.POST(request(input));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).segmentTargets, { ...segmentTargets, goalSeconds: 10200 });
  const moved = await route.POST(request({ ...input, date: '2027-05-10' }));
  assert.equal(moved.status, 200);
  assert.deepEqual((await moved.json()).segmentTargets, { format: 'olimpico', goalSeconds: 10200 });
  assert.equal((await route.POST(request({ ...input, segmentTargets: { ...input.segmentTargets, reviewedLevel: 'avancado' } }))).status, 422);
});

for (const file of ['app/api/profile/route.ts', 'app/api/profile/assessment/route.ts']) {
  test(`${file}: alteração parcial não pode contradizer a FC já persistida`, async () => {
    let saves = 0;
    const route = handler(file, { athleteProfile: {
      findUnique: async () => ({ birthDate: new Date('1990-01-01T12:00:00Z'), maxHeartRate: 180, restingHeartRate: 60, thresholdHeartRate: 160 }),
      upsert: async () => { saves++; return {}; },
    } });
    const response = await route.POST(request({ restingHeartRate: 190 }));
    assert.equal(response.status, 422);
    assert.equal(saves, 0);
    const body = await response.json();
    assert.equal(body.details[0].field, 'restingHeartRate');
  });

  test(`${file}: patch legítimo mantém datas e campos que não foram enviados`, async () => {
    const previous = { birthDate: new Date('1990-01-01T12:00:00Z'), currentWeight: 70, level: 'intermediario', modality: 'corrida', weeklyHours: 5, availableDays: ['seg'], maxHeartRate: 180, restingHeartRate: 60, nickname: 'Nome preservado' };
    let saves = 0;
    const route = handler(file, { athleteProfile: {
      findUnique: async () => previous,
      upsert: async ({ where, update }: any) => {
        saves++;
        assert.equal(where.userId, 'atleta-atual');
        assert.equal(update.currentWeight, 72);
        assert.equal(update.birthDate, undefined);
        assert.equal(update.nickname, undefined);
        assert.equal(update.maxHeartRate, undefined);
        assert.equal(update.restingHeartRate, undefined);
        assert.equal(update.level, undefined);
        assert.equal(update.modality, undefined);
        return { ...previous, ...Object.fromEntries(Object.entries(update).filter(([, value]) => value !== undefined)) };
      },
    } });
    assert.equal((await route.POST(request({ currentWeight: '72' }))).status, 200);
    assert.equal((await route.POST(request({ currentWeight: '72', level: '', modality: '' }))).status, 200);
    assert.equal(saves, 2);
    assert.equal(previous.nickname, 'Nome preservado');
    assert.equal(previous.birthDate.toISOString(), '1990-01-01T12:00:00.000Z');
  });
}
