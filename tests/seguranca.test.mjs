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
