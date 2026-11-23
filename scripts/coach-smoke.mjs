import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const { hash } = bcrypt;
const base = new URL(
  process.env.INTEGRATION_SMOKE_BASE || 'http://localhost:3000',
);
const database = new URL(process.env.DATABASE_URL || '');
if (
  !['localhost', '127.0.0.1'].includes(base.hostname) ||
  base.protocol !== 'http:' ||
  database.hostname !== '127.0.0.1' ||
  !['r10tri_test', 'r10tri_ci'].includes(database.pathname.slice(1))
)
  throw Error('Execute somente em ambiente local isolado.');
const db = new PrismaClient({ log: [] });
const nonce = randomBytes(12).toString('hex');
const identities = {};
let passed = 0,
  scenario = 'inicialização';
function client() {
  const jar = new Map();
  return {
    async request(path, { method = 'GET', body, form } = {}) {
      const r = await fetch(new URL(path, base), {
        method,
        redirect: 'manual',
        signal: AbortSignal.timeout(60000),
        headers: {
          cookie: [...jar].map(([k, v]) => k + '=' + v).join('; '),
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(form
            ? { 'Content-Type': 'application/x-www-form-urlencoded' }
            : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        ...(form ? { body: new URLSearchParams(form) } : {}),
      });
      for (const c of r.headers.getSetCookie()) {
        const p = c.split(';')[0],
          i = p.indexOf('=');
        jar.set(p.slice(0, i), p.slice(i + 1));
      }
      const text = await r.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {}
      return {
        status: r.status,
        data,
        location: r.headers.get('location') || '',
        text,
      };
    },
  };
}
async function fixture(key, role) {
  const password = randomBytes(24).toString('base64url');
  const user = await db.user.create({
    data: {
      email: `coach-test-${nonce}-${key}@example.invalid`,
      name: 'Teste fictício ' + key,
      role,
      password: await hash(password, 12),
    },
  });
  identities[key] = { ...user, password };
  const c = client(),
    csrf = await c.request('/api/auth/csrf');
  const r = await c.request('/api/auth/callback/credentials', {
    method: 'POST',
    form: {
      csrfToken: csrf.data.csrfToken,
      email: user.email,
      password,
      role: 'coach',
    },
  });
  assert.equal(r.location.includes('error='), false);
  assert.equal((await c.request('/api/auth/session')).data.user.role, role);
  return c;
}
const post = (c, action, body) =>
  c.request('/api/coach/' + action, { method: 'POST', body });
const athlete = (c, id) => c.request('/api/coach/athlete?id=' + id);
async function step(name, run) {
  scenario = name;
  await run();
  passed++;
}
const denied = (r) => assert.ok([401, 403, 404].includes(r.status));
const future = new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10);
const blocks = [
  { kind: 'aquecimento', label: 'Aquecimento', seconds: 300, zone: 'Z2' },
  {
    kind: 'principal',
    label: 'Trabalho por FTP',
    seconds: 600,
    repeat: 2,
    recoverySeconds: 120,
    zone: 'Z4',
    ftpLow: 95,
    ftpHigh: 100,
  },
  { kind: 'desaquecimento', label: 'Volta à calma', seconds: 300, zone: 'Z1' },
];
let ca, cb, aa, ab, linkA, linkB, draft, bike, run, completedSnapshot;
try {
  await step('login-dois-coaches-dois-atletas-e-redirecionamento', async () => {
    ca = await fixture('coachA', 'coach');
    cb = await fixture('coachB', 'coach');
    aa = await fixture('atletaA', 'atleta');
    ab = await fixture('atletaB', 'atleta');
    assert.equal((await ca.request('/acesso')).location, '/coach');
    assert.equal((await aa.request('/acesso')).location, '/dashboard');
    denied(await client().request('/api/coach/athletes'));
    denied(await aa.request('/api/coach/athletes'));
  });
  await step(
    'área-escolhida-é-validada-no-servidor-sem-elevar-permissões',
    async () => {
      for (const [key, area] of [
        ['coachA', 'coach'],
        ['atletaA', 'atleta'],
      ]) {
        const identity = identities[key];
        for (const selected of ['coach', 'atleta']) {
          const browser = client();
          const csrf = await browser.request('/api/auth/csrf');
          const login = await browser.request(
            '/api/auth/callback/credentials',
            {
              method: 'POST',
              form: {
                csrfToken: csrf.data.csrfToken,
                email: identity.email,
                password: identity.password,
                expectedRole: selected,
                role: selected,
              },
            },
          );
          const session = (await browser.request('/api/auth/session')).data;
          if (selected === area) {
            assert.equal(login.location.includes('error='), false);
            assert.equal(session.user.role, area);
          } else {
            assert.equal(
              new URL(login.location, base).searchParams.get('code'),
              'area_incorreta',
            );
            assert.equal(session?.user, undefined);
            denied(await browser.request('/api/coach/athletes'));
          }
          const verified = await browser.request('/api/auth/login', {
            method: 'POST',
            body: {
              email: identity.email,
              password: identity.password,
              expectedRole: selected,
            },
          });
          assert.equal(verified.status, selected === area ? 200 : 403);
          const mobile = await client().request('/api/mobile-auth/login', {
            method: 'POST',
            body: {
              email: identity.email,
              password: identity.password,
              expectedRole: selected,
            },
          });
          assert.equal(mobile.status, selected === area ? 200 : 403);
          if (selected === area) assert.equal(mobile.data.user.role, area);
          else assert.equal(mobile.data.token, undefined);
        }
      }
    },
  );
  await step('convites-sem-duplicação-ou-acesso-antecipado', async () => {
    for (const [c, key] of [
      [ca, 'atletaA'],
      [cb, 'atletaB'],
    ]) {
      const r = await post(c, 'invite', {
        name: 'Aluno convidado',
        email: identities[key].email,
      });
      assert.equal(r.status, 200);
      assert.equal(r.data.pending, true);
    }
    assert.equal(
      await db.user.count({ where: { email: identities.atletaA.email } }),
      1,
    );
    denied(await athlete(ca, identities.atletaA.id));
    linkA = (await aa.request('/api/coach/invitations')).data[0];
    linkB = (await ab.request('/api/coach/invitations')).data[0];
    assert.ok(linkA.id && linkB.id);
  });
  await step('aceite-exclusivo-do-destinatário', async () => {
    assert.equal(
      (await post(ca, 'respond', { id: linkA.id, accept: true })).status,
      403,
    );
    assert.equal(
      (await post(ab, 'respond', { id: linkA.id, accept: true })).status,
      409,
    );
    assert.equal(
      (await post(aa, 'respond', { id: linkA.id, accept: true })).status,
      200,
    );
    assert.equal(
      (await post(ab, 'respond', { id: linkB.id, accept: true })).status,
      200,
    );
    assert.equal(
      (await post(aa, 'respond', { id: linkA.id, accept: true })).status,
      409,
    );
  });
  await step('isolamento-de-listas-fichas-e-url-direta', async () => {
    const list = (await ca.request('/api/coach/athletes')).data;
    assert.equal(list.length, 1);
    assert.equal(list[0].athlete.id, identities.atletaA.id);
    denied(await athlete(cb, identities.atletaA.id));
    denied(await athlete(aa, identities.atletaB.id));
    assert.equal(
      (await cb.request('/coach/atletas/' + identities.atletaA.id)).status,
      404,
    );
    denied(
      await ca.request(
        '/api/coach-message/list?userId=' + identities.atletaB.id,
      ),
    );
  });
  await step('geracao-identifica-pendencias-sem-criar-rascunho', async()=>{
    const before=(await athlete(ca,identities.atletaA.id)).data.drafts.length;
    const response=await post(ca,'generate',{athleteId:identities.atletaA.id,startDate:new Date(Date.now()+86400000).toISOString().slice(0,10),weeks:1});
    assert.equal(response.status,422);
    assert.ok(response.data.assessmentIssues.some(issue=>issue.field==='birthDate'));
    assert.ok(response.data.assessmentIssues.some(issue=>issue.field==='weeklyHours'));
    assert.equal((await athlete(ca,identities.atletaA.id)).data.drafts.length,before);
  });
  await step('triagem-esportiva-auditada-e-perfil-sem-segredos', async () => {
    const profile = {
      birthDate: '1990-01-01',
      currentWeight: 70,
      modality: 'triatlo',
      weeklyHours: 6,
      currentWeeklyVol: 5,
      level: 'intermediario',
      availableDays: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'],
      ftp: 200,
      hasPowerMeter: true,
      hasPoolAccess: true,
      canSwim: true,
      planningPreferences: {
        recentMinutes:{corrida:100,ciclismo:120,natacao:80},
        doubleDays: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'],
        maxSessionMinutes: 120,
      },
    };
    assert.equal(
      (await post(ca, 'profile', { athleteId: identities.atletaA.id, profile }))
        .status,
      200,
    );
    assert.equal(
      (await post(cb, 'profile', { athleteId: identities.atletaA.id, profile }))
        .status,
      404,
    );
    const d = (await athlete(ca, identities.atletaA.id)).data;
    assert.equal('intervalsIcuApiKey' in d.profile, false);
    assert.equal(d.audits[0].actorId, identities.coachA.id);
  });
  await step('prova-e-objetivo-com-vínculo', async () => {
    const r = await post(ca, 'race', {
      athleteId: identities.atletaA.id,
      name: 'Prova fictícia',
      date: new Date(Date.now() + 70 * 86400000).toISOString().slice(0, 10),
      distance: 'olimpico',
      priority: 'A',
    });
    assert.equal(r.status, 200);
    denied(
      await post(cb, 'race', {
        athleteId: identities.atletaA.id,
        name: 'Outra',
        date: future,
        distance: 'sprint',
        priority: 'A',
      }),
    );
  });
  await step('brick-rascunho-com-partes-e-alvos-independentes', async () => {
    const r = await post(ca, 'session', {
      athleteId: identities.atletaA.id,
      session: {
        date: future,
        title: 'Brick fictício',
        modality: 'brick',
        phase: 'build',
        blocks,
        transitionSeconds: 120,
        runBlocks: [
          {
            kind: 'principal',
            label: 'Corrida de transição',
            seconds: 600,
            zone: 'Z2',
          },
        ],
      },
    });
    assert.equal(r.status, 200);
    draft = r.data;
    assert.equal(draft.payload.changes.length, 3);
    assert.equal(draft.payload.changes[0].structure.durationSeconds, 1920);
    assert.equal(draft.payload.changes[0].structure.steps[1].target.low, 190);
    assert.equal(
      draft.payload.changes[1].structure.distribution.enduranceSeconds,
      0,
    );
  });
  await step(
    'rascunho-invisível-em-todas-as-superfícies-do-atleta',
    async () => {
      assert.equal((await aa.request('/api/workouts')).data.length, 0);
      assert.equal(
        (await aa.request('/api/coach/publications')).data.length,
        0,
      );
      denied(await athlete(aa, identities.atletaA.id));
      denied(
        await post(cb, 'publish', {
          athleteId: identities.atletaA.id,
          draftId: draft.id,
          revision: draft.revision,
          acknowledge: true,
          instructions: '',
        }),
      );
    },
  );
  await step('publicação-atômica-e-orientações-no-calendário', async () => {
    assert.equal(
      (
        await post(ca, 'publish', {
          athleteId: identities.atletaA.id,
          draftId: draft.id,
          revision: draft.revision,
          acknowledge: true,
          instructions: 'Confira recuperação e terreno antes de iniciar.',
        })
      ).status,
      200,
    );
    const all = (await aa.request('/api/workouts')).data;
    assert.equal(all.length, 3);
    assert.deepEqual(
      all.map((w) => w.partOrder),
      [0, 1, 2],
    );
    assert.equal(new Set(all.map((w) => w.brickGroupId)).size, 1);
    bike = all.find((w) => w.modality === 'ciclismo');
    run = all.find((w) => w.title.includes('3. Corrida'));
    assert.ok(all.every((w) => w.coachManaged));
    const p = (await aa.request('/api/coach/publications')).data[0];
    assert.equal(p.changes.sessions.length, 3);
    assert.ok(p.instructions.includes('recuperação'));
    assert.equal(
      (await athlete(ca, identities.atletaA.id)).data.drafts.length,
      0,
    );
  });
  await step('ajuste-por-ftp-continua-em-rascunho', async () => {
    const r = await post(ca, 'session', {
      athleteId: identities.atletaA.id,
      session: {
        id: bike.id,
        date: future,
        title: 'Bike revisada',
        modality: 'ciclismo',
        blocks,
      },
    });
    assert.equal(r.status, 200);
    draft = r.data;
    assert.equal(
      (await aa.request('/api/workouts')).data.find((w) => w.id === bike.id)
        .title,
      bike.title,
    );
  });
  await step('mudança-de-disponibilidade-e-ftp-exige-revisão', async () => {
    assert.equal(
      (
        await post(ca, 'profile', {
          athleteId: identities.atletaA.id,
          profile: { ftp: 250, availableDays: ['seg', 'qua', 'sex'] },
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await post(ca, 'publish', {
          athleteId: identities.atletaA.id,
          draftId: draft.id,
          revision: draft.revision,
          acknowledge: true,
          instructions: '',
        })
      ).status,
      409,
    );
    assert.equal(
      (await athlete(ca, identities.atletaA.id)).data.drafts[0].profileConflict,
      true,
    );
    const rebased = await post(ca, 'rebase', {
      athleteId: identities.atletaA.id,
      draftId: draft.id,
      revision: draft.revision,
    });
    assert.equal(rebased.status, 200);
    draft = rebased.data;
    assert.equal(draft.payload.changes[0].structure.steps[1].target.low, 238);
    assert.equal(
      (
        await post(ca, 'publish', {
          athleteId: identities.atletaA.id,
          draftId: draft.id,
          revision: draft.revision,
          acknowledge: true,
          instructions: 'Novos alvos com FTP atualizado.',
        })
      ).status,
      200,
    );
  });
  await step('histórico-realizado-impede-reescrita', async () => {
    assert.equal(
      (
        await aa.request('/api/workouts/log', {
          method: 'POST',
          body: {
            workoutId: bike.id,
            actualDuration: 30,
            rpe: 5,
            fatigueScore: 3,
            painScore: 0,
            sleepHours: 8,
          },
        })
      ).status,
      200,
    );
    completedSnapshot = JSON.stringify(
      await db.workout.findUnique({
        where: { id: bike.id },
        include: { log: true },
      }),
    );
    assert.equal(
      (
        await post(ca, 'session', {
          athleteId: identities.atletaA.id,
          session: {
            id: bike.id,
            date: future,
            title: 'Tentativa',
            modality: 'ciclismo',
            blocks,
          },
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await aa.request('/api/workouts/update', {
          method: 'POST',
          body: { id: bike.id, title: 'Tentativa' },
        })
      ).status,
      409,
    );
    denied(
      await ca.request('/api/workouts/update', {
        method: 'POST',
        body: { id: bike.id, title: 'Tentativa' },
      }),
    );
    assert.equal(
      JSON.stringify(
        await db.workout.findUnique({
          where: { id: bike.id },
          include: { log: true },
        }),
      ),
      completedSnapshot,
    );
  });
  await step('duplicação-não-altera-original-realizado', async () => {
    const r = await post(ca, 'session', {
      athleteId: identities.atletaA.id,
      duplicate: true,
      session: {
        id: bike.id,
        date: future,
        title: 'Cópia futura',
        modality: 'ciclismo',
        blocks,
      },
    });
    assert.equal(r.status, 200);
    assert.equal(r.data.payload.changes[0].id, undefined);
    assert.equal(
      JSON.stringify(
        await db.workout.findUnique({
          where: { id: bike.id },
          include: { log: true },
        }),
      ),
      completedSnapshot,
    );
  });
  await step('cancelamento-só-aparece-após-publicação', async () => {
    const r = await post(ca, 'batch', {
      athleteId: identities.atletaA.id,
      operation: 'cancel',
      ids: [run.id],
    });
    assert.equal(r.status, 200);
    draft = r.data;
    assert.equal(
      (await aa.request('/api/workouts')).data.find((w) => w.id === run.id)
        .paused,
      false,
    );
    assert.equal(
      (
        await post(ca, 'publish', {
          athleteId: identities.atletaA.id,
          draftId: draft.id,
          revision: draft.revision,
          acknowledge: true,
          instructions: 'Recuperar antes de retomar a corrida.',
        })
      ).status,
      200,
    );
    assert.equal(
      (await aa.request('/api/workouts')).data.find((w) => w.id === run.id)
        .paused,
      true,
    );
    assert.equal(
      (
        await aa.request('/api/workouts/log', {
          method: 'POST',
          body: { workoutId: run.id },
        })
      ).status,
      409,
    );
  });
  await step(
    'nova-geração-preserva-prescrição-do-coach-e-histórico',
    async () => {
      assert.equal(
        (
          await aa.request('/api/plan/generate', {
            method: 'POST',
            body: { startDate: future, weeks: 1 },
          })
        ).status,
        409,
      );
      const r = await post(ca, 'generate', {
        athleteId: identities.atletaA.id,
        startDate: future,
        weeks: 4,
      });
      assert.equal(r.status, 200);
      draft = r.data;
      assert.ok(draft.payload.changes.some((c) => !c.id));
      assert.equal(
        JSON.stringify(
          await db.workout.findUnique({
            where: { id: bike.id },
            include: { log: true },
          }),
        ),
        completedSnapshot,
      );
    },
  );
  await step('sugestão-do-gerador-pode-ser-editada-sem-publicar', async () => {
    const c = draft.payload.changes.find(
      (c) => !c.id && c.modality !== 'descanso',
    );
    const modified = await post(ca, 'session', {
      athleteId: identities.atletaA.id,
      draftId: draft.id,
      revision: draft.revision,
      changeKey: c.key,
      session: {
        date: c.date,
        title: 'Sugestão revisada pelo coach',
        modality: c.modality,
        blocks: [
          {
            kind: 'principal',
            label: 'Bloco conservador revisado',
            seconds: 600,
            zone: 'Z2',
          },
        ],
      },
    });
    assert.equal(modified.status, 200);
    assert.equal(
      modified.data.payload.changes.length,
      draft.payload.changes.length,
    );
    draft = modified.data;
    assert.ok(
      draft.payload.changes.some(
        (c) => c.title === 'Sugestão revisada pelo coach',
      ),
    );
    assert.equal(
      (await aa.request('/api/workouts')).data.some(
        (w) => w.title === 'Sugestão revisada pelo coach',
      ),
      false,
    );
  });
  await step('revisão-obsoleta-não-sobrescreve-rascunho', async () => {
    const b = {
      athleteId: identities.atletaA.id,
      draftId: draft.id,
      revision: draft.revision,
      operation: 'discardChange',
      ids: [draft.payload.changes[0].key],
    };
    assert.equal((await post(ca, 'batch', b)).status, 200);
    assert.equal((await post(ca, 'batch', b)).status, 409);
  });
  await step(
    'orientações-salvas-e-bloco-gerado-publicado-com-histórico-preservado',
    async () => {
      draft = (await athlete(ca, identities.atletaA.id)).data.drafts.find(
        (d) => d.id === draft.id,
      );
      const saved = await post(ca, 'notes', {
        athleteId: identities.atletaA.id,
        draftId: draft.id,
        revision: draft.revision,
        instructions: 'Bloco revisado: acompanhar esforço e recuperação.',
      });
      assert.equal(saved.status, 200);
      draft = saved.data;
      assert.ok(draft.instructions.includes('Bloco revisado'));
      const published = await post(ca, 'publish', {
        athleteId: identities.atletaA.id,
        draftId: draft.id,
        revision: draft.revision,
        acknowledge: true,
        instructions: draft.instructions,
      });
      assert.equal(published.status, 200);
      assert.equal(
        JSON.stringify(
          await db.workout.findUnique({
            where: { id: bike.id },
            include: { log: true },
          }),
        ),
        completedSnapshot,
      );
      assert.ok(
        (await aa.request('/api/workouts')).data.some(
          (w) => w.title === 'Sugestão revisada pelo coach',
        ),
      );
    },
  );
  await step('novo-atleta-e-renovação-segura-sem-duplicação', async () => {
    const body = {
      email: `coach-test-${nonce}-novo@example.invalid`,
      name: 'Novo aluno fictício',
    };
    const r = await post(ca, 'invite', body);
    assert.equal(r.status, 200);
    assert.ok(r.data.invitationUrl);
    const token = new URLSearchParams(
      new URL(r.data.invitationUrl).hash.slice(1),
    ).get('convite');
    const row = await db.verificationToken.findFirst({
      where: { identifier: 'convite:' + body.email },
    });
    assert.notEqual(row.token, token);
    const renewed = await post(ca, 'invite', body);
    assert.equal(renewed.status, 200);
    assert.notEqual(renewed.data.invitationUrl, r.data.invitationUrl);
    assert.equal(await db.user.count({ where: { email: body.email } }), 1);
  });
  await step(
    'encerramento-revoga-consultas-alterações-e-publicações',
    async () => {
      assert.equal(
        (await post(ca, 'end', { athleteId: identities.atletaA.id })).status,
        200,
      );
      denied(await athlete(ca, identities.atletaA.id));
      denied(
        await post(ca, 'profile', {
          athleteId: identities.atletaA.id,
          profile: { ftp: 300 },
        }),
      );
      denied(
        await post(ca, 'session', {
          athleteId: identities.atletaA.id,
          session: {
            date: future,
            title: 'Sem acesso',
            modality: 'corrida',
            blocks: [{ kind: 'principal', label: 'Fácil', seconds: 600 }],
          },
        }),
      );
      denied(
        await ca.request('/api/workouts/export?id=' + bike.id + '&format=txt'),
      );
      denied(
        await post(ca, 'publish', {
          athleteId: identities.atletaA.id,
          draftId: draft.id,
          revision: draft.revision + 1,
          acknowledge: true,
          instructions: '',
        }),
      );
      assert.equal((await aa.request('/api/workouts')).status, 200);
      assert.equal(
        JSON.stringify(
          await db.workout.findUnique({
            where: { id: bike.id },
            include: { log: true },
          }),
        ),
        completedSnapshot,
      );
      assert.equal((await athlete(cb, identities.atletaB.id)).status, 200);
    },
  );
  console.log(
    JSON.stringify({
      cenarios: passed,
      aprovados: passed,
      falhas: 0,
      contasFicticias: 5,
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      actual: typeof error.actual === 'number' ? error.actual : undefined,
      expected: typeof error.expected === 'number' ? error.expected : undefined,
      at: error.stack?.split('\n').find((l) => l.includes('coach-smoke.mjs:')),
    }),
  );
  console.error(
    JSON.stringify({
      cenarios: passed + 1,
      aprovados: passed,
      falhas: 1,
      cenarioComFalha: scenario,
    }),
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
