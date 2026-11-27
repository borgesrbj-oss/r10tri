import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const nativeRequire = createRequire(import.meta.url);
const root = fileURLToPath(new URL('..', import.meta.url));

// Executa os handlers reais com fronteiras HTTP, sessão e banco controladas.
function load(file, prisma = {}, user = { id: 'atleta-a', role: 'atleta' }) {
  const source = ts.transpileModule(
    fs.readFileSync(path.join(root, file), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const sandboxModule = { exports: {} };
  const dependencies = {
    'next/server': {
      NextResponse: { json: (body, options) => Response.json(body, options) },
    },
    '@/auth': { auth: async () => (user ? { user } : null) },
    '@/lib/db': { prisma },
    '@/lib/coach-access': {
      canAccessAthlete: async (actor, id) => actor.id === id,
      CoachError: class extends Error {
        constructor(message, status) {
          super(message);
          this.status = status;
        }
      },
      coachErrorResponse: (error) =>
        Response.json(
          { error: error.message },
          { status: error.status || 500 },
        ),
    },
    '@/lib/coach-service': {
      inviteAthlete: async (actor) => {
        throw Object.assign(new Error('Não autorizado'), {
          status: actor.role === 'coach' ? 409 : 403,
        });
      },
    },
    '@/lib/invitations':
      file === 'lib/invitations.ts' ? {} : load('lib/invitations.ts'),
    '@/lib/wa': { buildWaLink: () => null },
    bcryptjs: { hash: async () => 'hash-de-teste' },
  };
  vm.runInNewContext(
    source,
    {
      exports: sandboxModule.exports,
      module: sandboxModule,
      require: (name) =>
        name in dependencies ? dependencies[name] : nativeRequire(name),
      Response,
      URL,
      URLSearchParams,
      Buffer,
      console,
      process: { env: {} },
    },
    { filename: file },
  );
  return sandboxModule.exports;
}

function request(body) {
  return new Request('http://localhost:3000/api/teste', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function workoutDatabase() {
  const writes = [];
  const workouts = [
    { id: 'meu-treino', userId: 'atleta-a' },
    { id: 'treino-alheio', userId: 'atleta-b' },
  ];
  const plans = [
    { id: 'meu-plano', userId: 'atleta-a' },
    { id: 'plano-alheio', userId: 'atleta-b' },
  ];
  const match = (row, where) =>
    Object.entries(where).every(([key, value]) => row[key] === value);
  const prisma = {
    workout: {
      updateMany: async ({ where, data }) => {
        writes.push(['atualizar', where, data]);
        return { count: 1 };
      },
      findFirst: async ({ where }) =>
        workouts.find((row) => match(row, where)) ?? null,
      create: async ({ data }) => {
        writes.push(['criar', data]);
        return { id: 'novo', ...data };
      },
      update: async ({ where, data }) => {
        writes.push(['atualizar', where, data]);
        return { ...where, ...data };
      },
    },
    trainingPlan: {
      findFirst: async ({ where }) =>
        plans.find((row) => match(row, where)) ?? null,
    },
    workoutLog: {
      upsert: async (args) => {
        writes.push(['registrar', args]);
        return args.create;
      },
    },
    weightLog: {
      create: async (args) => {
        writes.push(['peso', args]);
        return args.data;
      },
    },
    $transaction: async (callback) => callback(prisma),
  };
  return { prisma, writes };
}

test('atleta não pode registrar ou concluir o treino de outro atleta', async () => {
  const { prisma, writes } = workoutDatabase();
  const response = await load('app/api/workouts/log/route.ts', prisma).POST(
    request({ workoutId: 'treino-alheio', actualDuration: 15 }),
  );
  assert.equal(response.status, 404);
  assert.equal(writes.length, 0);
});

test('dono continua podendo registrar e concluir o próprio treino', async () => {
  const { prisma, writes } = workoutDatabase();
  const response = await load('app/api/workouts/log/route.ts', prisma).POST(
    request({ workoutId: 'meu-treino', actualDuration: 45, weight: 70 }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(
    writes.map(([action]) => action),
    ['atualizar', 'registrar', 'peso'],
  );
  assert.equal(writes[1][1].create.userId, 'atleta-a');
});

test('descanso confirmado é idempotente por data e gravado para a conta autenticada', async () => {
  const writes = [];
  const prisma = { workout: { upsert: async input => writes.push(input) } };
  const route = 'app/api/workouts/rest/route.ts';
  const body = { date: '2026-01-01', userId: 'atleta-b' };
  assert.equal((await load(route, prisma, null).POST(request(body))).status, 401);
  const own = load(route, prisma);
  for (const date of ['2026-02-31', '2026-01-01T12:00:00Z', '2100-01-01']) {
    assert.equal((await own.POST(request({ date }))).status, 422);
  }
  assert.equal(writes.length, 0);
  assert.equal((await own.POST(request(body))).status, 200);
  assert.equal((await own.POST(request(body))).status, 200);
  assert.equal(writes[0].where.id, writes[1].where.id);
  assert.equal(writes[0].create.userId, 'atleta-a');
  assert.equal(writes[0].create.duration, 0);
  assert.equal(writes[0].create.completed, true);
});

test('registro de bike guarda as potências separadas e usa o limiar da sessão no primeiro registro', async () => {
  const { buildWorkoutStructure } = nativeRequire('../lib/training-structure.ts');
  const { markRunningThreshold } = nativeRequire('../lib/training-audit.ts');
  const structure = buildWorkoutStructure({ ftp: 250 }, 'ciclismo', 'base', 60);
  markRunningThreshold(structure, { ftp: 250 });
  const { prisma, writes } = workoutDatabase();
  prisma.workout.findFirst = async ({ where }) => ({ ...where, modality: 'ciclismo', structure });
  const route = load('app/api/workouts/log/route.ts', prisma);
  const body = { workoutId: 'meu-treino', actualDuration: 60, normalizedPowerWatts: 188, averagePowerWatts: 160, metricThreshold: { basis: 'ftp', value: 500 } };
  assert.equal((await route.POST(request({ ...body, averagePowerWatts: -1 }))).status, 422);
  assert.equal(writes.length, 0);
  assert.equal((await route.POST(request(body))).status, 200);
  const saved = writes[1][1];
  assert.equal(saved.create.normalizedPowerWatts, 188);
  assert.equal(saved.create.averagePowerWatts, 160);
  assert.equal(saved.create.metricThreshold.value, 250);
  assert.equal(saved.update.metricThreshold, undefined);
});

test('atleta não pode alterar treino alheio por nenhuma rota de atualização', async () => {
  for (const file of [
    'app/api/workouts/route.ts',
    'app/api/workouts/update/route.ts',
  ]) {
    const { prisma, writes } = workoutDatabase();
    const response = await load(file, prisma).POST(
      request({ id: 'treino-alheio', title: 'Alteração indevida' }),
    );
    assert.equal(response.status, 404, file);
    assert.equal(writes.length, 0, file);
  }
});

function adaptationDatabase(overrides = {}) {
  const { buildWorkoutStructure } = nativeRequire('../lib/training-structure.ts');
  const structure = buildWorkoutStructure({ runThresholdPace: '4:30' }, 'corrida', 'build', 60, 720, 'Z4');
  const workout = {
    id: 'sessao-ajustavel', userId: 'atleta-a', plan: null, planId: null,
    date: new Date('2099-02-02T12:00:00Z'), updatedAt: new Date('2099-01-01T12:00:00Z'),
    completed: false, coachManaged: false, paused: false, brickGroupId: null,
    duration: 60, modality: 'corrida', targetZone: 'Z4', structure,
    description: 'Orientação pessoal preservada.', ...overrides,
  };
  const calendar = [workout];
  const writes = [];
  const prisma = {
    workout: {
      findFirst: async ({ where }) => workout.id === where.id && workout.userId === where.userId ? workout : null,
      findMany: async () => calendar,
      updateMany: async ({ where, data }) => {
        assert.equal(where.userId, workout.userId);
        assert.equal(where.updatedAt, workout.updatedAt);
        assert.equal(where.completed, false);
        assert.equal(where.coachManaged, false);
        assert.equal(where.brickGroupId, null);
        writes.push(data);
        return { count: 1 };
      },
    },
    athleteProfile: {
      findUnique: async () => ({ availableDays: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'], weeklyHours: 4 }),
    },
    targetRace: { findMany: async () => [] },
    $transaction: async (callback) => callback(prisma),
  };
  return { workout, calendar, writes, prisma };
}

test('versão leve mostra a queda da intensidade e só grava após confirmar a prévia correspondente', async () => {
  const { workout, prisma, writes } = adaptationDatabase();
  const route = load('app/api/workouts/adapt/route.ts', prisma);
  const body = { id: workout.id, action: 'leve' };
  assert.equal((await route.POST(request(body))).status, 409);
  const response = await route.POST(request({ ...body, preview: true }));
  assert.equal(response.status, 200);
  const proposal = await response.json();
  assert.equal(writes.length, 0);
  assert.equal(proposal.duration, 60);
  assert.equal(proposal.review.weeks[0].before.highMinutes, 12);
  assert.equal(proposal.review.weeks[0].after.highMinutes, 0);
  assert.match(proposal.previewId, /^[0-9a-f]{64}$/);
  assert.equal((await route.POST(request({ ...body, expectedPreview: proposal.previewId }))).status, 200);
  assert.equal(writes[0].structure.distribution.highSeconds, 0);
  assert.equal(writes[0].structure.durationSeconds, 3600);
  assert.match(writes[0].description, /Orientação pessoal preservada/);
});

test('mudança de dia prevê a falta de espaço e menos de 48 horas sem gravar', async () => {
  const { workout, prisma, writes, calendar } = adaptationDatabase();
  const { dayKey } = nativeRequire('../lib/planning-preferences.ts');
  const destination = '2099-02-05';
  const closeWorkout = {
    ...workout, id: 'sessao-intensa', date: new Date('2099-02-06T12:00:00Z'),
  };
  calendar.push(closeWorkout);
  prisma.athleteProfile.findUnique = async () => ({
    availableDays: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'],
    dailyMinutes: { [dayKey(destination)]: 35 },
  });
  const route = load('app/api/workouts/adapt/route.ts', prisma);
  const body = { id: workout.id, action: 'mover', date: destination };
  const response = await route.POST(request({ ...body, preview: true }));
  assert.equal(response.status, 200);
  const proposal = await response.json();
  assert.ok(proposal.review.conflicts.some((message) => message.includes('limite de 35 minutos')));
  assert.ok(proposal.review.conflicts.some((message) => message.includes('48 horas')));
  assert.equal((await route.POST(request({ ...body, expectedPreview: proposal.previewId }))).status, 409);
  assert.equal(writes.length, 0);
});

test('confirmação recusa a prévia após mudança de carga na semana', async () => {
  const { workout, prisma, writes, calendar } = adaptationDatabase();
  const route = load('app/api/workouts/adapt/route.ts', prisma);
  const body = { id: workout.id, action: 'encurtar', minutes: 35 };
  const proposal = await (await route.POST(request({ ...body, preview: true }))).json();
  assert.equal(proposal.review.weeks[0].after.minutes, 35);
  calendar.push({ ...workout, id: 'nova-sessao' });
  const response = await route.POST(request({ ...body, expectedPreview: proposal.previewId }));
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /mudou desde a prévia/);
  assert.equal(writes.length, 0);
});

test('rotas do atleta preservam partes de treino combinado', async () => {
  for (const file of [
    'app/api/workouts/route.ts', 'app/api/workouts/update/route.ts',
    'app/api/workouts/delete/route.ts', 'app/api/workouts/adapt/route.ts',
  ]) {
    const { workout, prisma, writes } = adaptationDatabase({ brickGroupId: 'brick-inteiro' });
    const response = await load(file, prisma).POST(request({ id: workout.id, action: 'pausar' }));
    assert.equal(response.status, 409, file);
    assert.match((await response.json()).error, /treino combinado/);
    assert.equal(writes.length, 0, file);
  }
});

test('rota legada não concede ao coach alteração direta do calendário de atleta', async () => {
  const { prisma, writes } = workoutDatabase();
  const response = await load('app/api/workouts/update/route.ts', prisma, {
    id: 'coach',
    role: 'coach',
  }).POST(request({ id: 'treino-alheio', title: 'Treino ajustado' }));
  assert.equal(response.status, 404);
  assert.equal(writes.length, 0);
});

test('criação rejeita plano de outro atleta em ambas as rotas', async () => {
  for (const file of [
    'app/api/workouts/route.ts',
    'app/api/workouts/create/route.ts',
  ]) {
    const { prisma, writes } = workoutDatabase();
    const response = await load(file, prisma).POST(
      request({
        planId: 'plano-alheio',
        title: 'Corrida',
        modality: 'corrida',
        date: '2026-11-15',
      }),
    );
    assert.equal(response.status, 404, file);
    assert.equal(writes.length, 0, file);
  }
});

test('alteração de vínculo rejeita plano de outro dono, inclusive quando feita pelo coach', async () => {
  const { prisma, writes } = workoutDatabase();
  const response = await load('app/api/workouts/update/route.ts', prisma, {
    id: 'coach',
    role: 'coach',
  }).POST(request({ id: 'meu-treino', planId: 'plano-alheio' }));
  assert.equal(response.status, 404);
  assert.equal(writes.length, 0);
});

test('token de convite tem 256 bits aleatórios e somente seu hash é persistido', () => {
  const helpers = load('lib/invitations.ts');
  const first = helpers.newInvitation(
    '  Atleta@exemplo.com ',
    new Date('2026-11-13T12:00:00Z'),
  );
  const second = helpers.newInvitation('atleta@exemplo.com');
  assert.match(first.token, /^[a-f0-9]{64}$/);
  assert.notEqual(first.token, second.token);
  assert.notEqual(first.token, first.record.token);
  assert.equal(first.record.token, helpers.invitationTokenHash(first.token));
  assert.equal(first.record.identifier, 'convite:atleta@exemplo.com');
  assert.equal(first.record.expires.toISOString(), '2026-11-15T12:00:00.000Z');
  const url = new URL(
    helpers.invitationUrl(
      'https://exemplo.com',
      'atleta@exemplo.com',
      first.token,
    ),
  );
  assert.equal(url.search, '');
  assert.equal(
    new URLSearchParams(url.hash.slice(1)).get('convite'),
    first.token,
  );
});

function invitationDatabase({ expired = false, password = null } = {}) {
  const helpers = load('lib/invitations.ts');
  const invitation = helpers.newInvitation('atleta@exemplo.com');
  if (expired) invitation.record.expires = new Date(0);
  let record = invitation.record;
  const user = {
    id: 'atleta-a',
    email: 'atleta@exemplo.com',
    role: 'atleta',
    password,
  };
  let updates = 0;
  const prisma = {
    verificationToken: {
      findUnique: async ({ where }) =>
        record &&
        where.identifier_token.identifier === record.identifier &&
        where.identifier_token.token === record.token
          ? record
          : null,
      deleteMany: async () => {
        if (!record) return { count: 0 };
        record = null;
        return { count: 1 };
      },
    },
    user: {
      findUnique: async ({ where }) =>
        where.email === user.email ? user : null,
      updateMany: async () => {
        if (user.password !== null) return { count: 0 };
        updates++;
        user.password = 'hash-de-teste';
        return { count: 1 };
      },
    },
    $transaction: async (callback) => callback(prisma),
  };
  return { prisma, invitation, updates: () => updates };
}

test('conhecer o e-mail não permite tomar posse de uma conta convidada', async () => {
  const db = invitationDatabase();
  const response = await load(
    'app/api/auth/set-password/route.ts',
    db.prisma,
  ).POST(request({ email: 'atleta@exemplo.com', password: 'Senha-de-teste' }));
  assert.equal(response.status, 400);
  assert.equal(db.updates(), 0);
});

test('convite inválido, expirado ou de outro e-mail não altera senha', async () => {
  for (const scenario of ['invalido', 'expirado', 'outro-email']) {
    const db = invitationDatabase({ expired: scenario === 'expirado' });
    const response = await load(
      'app/api/auth/set-password/route.ts',
      db.prisma,
    ).POST(
      request({
        email:
          scenario === 'outro-email'
            ? 'outra@exemplo.com'
            : 'atleta@exemplo.com',
        password: 'Senha-de-teste',
        token: scenario === 'invalido' ? 'a'.repeat(64) : db.invitation.token,
      }),
    );
    assert.equal(response.status, 400, scenario);
    assert.equal(db.updates(), 0, scenario);
  }
});

test('convite válido define a senha apenas uma vez, inclusive com envios concorrentes', async () => {
  const db = invitationDatabase();
  const route = load('app/api/auth/set-password/route.ts', db.prisma);
  const body = {
    email: 'atleta@exemplo.com',
    password: 'Senha-de-teste',
    token: db.invitation.token,
  };
  const responses = await Promise.all([
    route.POST(request(body)),
    route.POST(request(body)),
  ]);
  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [200, 400],
  );
  assert.equal(db.updates(), 1);
  assert.equal((await route.POST(request(body))).status, 400);
});

test('convite não substitui uma senha já definida', async () => {
  const db = invitationDatabase({ password: 'senha-anterior' });
  const response = await load(
    'app/api/auth/set-password/route.ts',
    db.prisma,
  ).POST(
    request({
      email: 'atleta@exemplo.com',
      password: 'Senha-de-teste',
      token: db.invitation.token,
    }),
  );
  assert.equal(response.status, 400);
  assert.equal(db.updates(), 0);
});

test('cadastro de atleta exige sessão de coach antes de acessar o banco', async () => {
  for (const user of [null, { id: 'atleta-a', role: 'atleta' }]) {
    const response = await load(
      'app/api/athlete/create/route.ts',
      {},
      user,
    ).POST(request({ email: 'atleta@exemplo.com' }));
    assert.equal(response.status, user ? 403 : 401);
  }
});

test('registro recusa prescrição alterada durante a conclusão sem gravar log ou peso', async () => {
  const { prisma, writes } = workoutDatabase();
  prisma.workout.updateMany = async () => ({ count: 0 });
  const response = await load('app/api/workouts/log/route.ts', prisma).POST(
    request({ workoutId: 'meu-treino', actualDuration: 45, weight: 70 }),
  );
  assert.equal(response.status, 409);
  assert.equal(writes.length, 0);
});
