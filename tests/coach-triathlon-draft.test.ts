import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const base = fileURLToPath(new URL('../lib/', import.meta.url));

function loadModule(filename: string, overrides: Record<string, unknown>) {
  const file = path.join(base, filename);
  const nativeRequire = createRequire(file);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const commonJsModule = { exports: {} };
  vm.runInNewContext(source, {
    module: commonJsModule, exports: commonJsModule.exports, Date,
    require: (name: string) => name in overrides ? overrides[name] : nativeRequire(name),
  }, { filename: file });
  return commonJsModule.exports;
}

test('coach gera 24 semanas e precisa revisar se a prova mudar antes da publicação', async () => {
  const athleteId = 'atleta-vinculado';
  const coach = { id: 'coach-responsavel', role: 'coach' };
  const startDate = '2035-01-01';
  const race = { id: 'full', userId: athleteId, date: new Date('2035-06-17T12:00:00Z'), priority: 'A', distance: 'ironman', updatedAt: new Date('2034-12-01') };
  const profile = {
    userId: athleteId, level: 'avancado', modality: 'triatlo', weeklyHours: 11, currentWeeklyVol: 8,
    trainingGoal: 'ironman', birthDate: new Date('1990-03-01'), currentWeight: 73, updatedAt: new Date('2034-12-01'),
    availableDays: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'], ftp: 250, swimCssPace: '01:45', runThresholdPace: '04:50',
    planningPreferences: { recentMinutes: { natacao: 90, ciclismo: 240, corrida: 150 }, preferred: { brick: ['sab'] }, doubleDays: ['sab'] },
  };
  const link = { id: 'vinculo', status: 'active' };
  let draft: any;
  const tx = {
    coachAthlete: {
      findUnique: async ({ where }: any) => where.coachId_athleteId.coachId === coach.id && where.coachId_athleteId.athleteId === athleteId ? link : null,
      updateMany: async () => ({ count: 1 }),
    },
    athleteProfile: { findUnique: async () => profile },
    targetRace: {
      findMany: async () => [race],
      findFirst: async ({ where }: any) => {
        assert.equal(where.id, race.id);
        assert.equal(where.userId, athleteId);
        return race;
      },
    },
    workout: { findMany: async () => [] },
    workoutLog: { findMany: async () => [] },
    coachDraft: {
      create: async ({ data }: any) => (draft = { ...data, id: 'rascunho', revision: 1 }),
      findFirst: async ({ where }: any) => where.linkId === link.id && where.id === draft.id ? draft : null,
      update: async ({ data }: any) => (draft = { ...draft, ...data, revision: draft.revision + 1 }),
    },
  };
  const prisma = { $transaction: async (run: (tx: unknown) => Promise<unknown>) => run(tx) };
  const access = loadModule('coach-access.ts', { './db': { prisma } });
  const service = loadModule('coach-service.ts', { './db': { prisma }, './coach-access': access }) as typeof import('../lib/coach-service');
  await assert.rejects(service.generateCoachDraft({ id: 'outro-coach', role: 'coach' }, { athleteId, startDate, weeks: 24, instructions: '' }), { status: 404 });
  await assert.rejects(service.generateCoachDraft({ id: coach.id, role: 'atleta' }, { athleteId, startDate, weeks: 24, instructions: '' }), { status: 403 });
  const generated = await service.generateCoachDraft(coach, { athleteId, startDate, weeks: 24, instructions: '' });
  assert.equal(generated.id, 'rascunho');
  assert.equal(draft.payload.generation.weeks.length, 24);
  assert.equal(draft.payload.generation.raceId, race.id);
  assert.equal(draft.payload.baseRaceAt, race.updatedAt.toISOString());
  assert.ok(draft.payload.changes.some((change: any) => change.weekNumber > 12));
  const t2 = draft.payload.changes.find((change: any) => change.structure.transition === 'T2');
  assert.ok(t2);
  await service.upsertSession(coach, { athleteId, draftId: draft.id, revision: 1, instructions: '', changeKey: t2.key,
    session: { date: t2.date, title: t2.title, modality: 'corrida', phase: t2.phase,
      blocks: [{ kind: 'recuperacao', label: 'Trocar equipamento', seconds: 30, passive: true }],
    },
  });
  const editedT2 = draft.payload.changes.find((change: any) => change.brickGroupId === t2.brickGroupId && change.partOrder === 1);
  assert.equal(editedT2.modality, 'descanso');
  assert.equal(editedT2.weekNumber, t2.weekNumber);
  assert.equal(editedT2.structure.durationSeconds, 30);
  const run = draft.payload.changes.find((change: any) => change.brickGroupId === t2.brickGroupId && change.partOrder === 2);
  draft.payload.changes = draft.payload.changes.filter((change: any) => change.key !== run.key);
  await assert.rejects(service.publishDraft(coach, {
    athleteId, draftId: draft.id, revision: 2, acknowledge: true, instructions: '',
  }), { status: 422, message: /revise o brick/i });
  draft.payload.changes.push(run);
  race.updatedAt = new Date('2034-12-02');
  await assert.rejects(service.publishDraft(coach, {
    athleteId, draftId: draft.id, revision: 2, acknowledge: true, instructions: '',
  }), { status: 409, message: /prova-alvo mudou/i });
});
