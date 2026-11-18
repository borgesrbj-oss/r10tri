import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import * as training from '../lib/training-structure';
import { assessmentReadiness } from '../lib/assessment-validation';
import { trainingFeedback } from '../lib/training-feedback';
import type { TrainingProfile } from '../lib/training-types';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = ts.transpileModule(fs.readFileSync(path.join(root, 'app/api/plan/generate/route.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText;
const profile = { birthDate: new Date('1990-01-01T12:00:00Z'), currentWeight: 70, level: 'intermediario', modality: 'corrida', weeklyHours: 6, currentWeeklyVol: 5, availableDays: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'], runThresholdPace: '05:00', thresholdHeartRate: 170, maxHeartRate: 190, hasHRM: true };

function endpoint({ savedProfile = profile as TrainingProfile, user = { id: 'atleta-atual', role: 'atleta' } as { id: string; role: string } | null } = {}) {
  const state = { archives: 0, createdPlan: null as any, savedWorkouts: [] as any[], profileUpdate: null as any, generationArguments: null as Parameters<typeof training.generateStructuredPlan> | null };
  const database = {
    athleteProfile: {
      findUnique: async () => savedProfile,
      update: async ({ data }: any) => { state.profileUpdate = data; return data; },
    },
    targetRace: { findMany: async () => [{id:'prova-b',name:'Prova secundária',date:new Date('2026-12-01T12:00:00Z'),distance:'5k',priority:'B'}, { id: 'prova-a', name: 'Prova-alvo', date: new Date('2027-04-05T12:00:00Z'), distance: '42k',priority:'A' }] },
    trainingPlan: {
      updateMany: async () => { state.archives++; return { count: 1 }; },
      create: async ({ data }: any) => { state.createdPlan = { id: 'novo-plano', ...data }; return state.createdPlan; },
    },
    workoutLog:{findMany:async()=>[]},
    workout: {findMany:async()=>[], createMany: async ({ data }: any) => { state.savedWorkouts = data; return { count: data.length }; } },
  };
  const prisma = { ...database, $transaction: async (callback: (transaction: typeof database) => Promise<unknown>) => callback(database) };
  const dependencies: Record<string, unknown> = {
    'next/server': { NextResponse: { json: (body: unknown, options?: ResponseInit) => Response.json(body, options) } },
    '@/auth': { auth: async () => user ? { user } : null },
    '@/lib/db': { prisma },
    '@/lib/plan-engine': { generateNutrition: () => 'Orientações gerais de alimentação.' },
    '@/lib/assessment-validation': { assessmentReadiness },
    '@/lib/training-feedback':{trainingFeedback},
    '@/lib/training-structure': { ...training, generateStructuredPlan: (...args: Parameters<typeof training.generateStructuredPlan>) => { state.generationArguments = args; return training.generateStructuredPlan(...args); } },
  };
  const sandboxModule = { exports: {} };
  vm.runInNewContext(source, {
    module: sandboxModule, exports: sandboxModule.exports,
    require: (name: string) => {
      if (!(name in dependencies)) throw new Error(`Dependência não simulada: ${name}`);
      return dependencies[name];
    },
    Response, Date,
  }, { filename: 'app/api/plan/generate/route.ts' });
  const handler = sandboxModule.exports as { POST: (request: Request) => Promise<Response> };
  return { state, post: (body: unknown) => handler.POST(new Request('https://app.example/api/plan/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })) };
}

test('handler preserva Auto omitido e salva prova, transição e resumo de 22 semanas', async () => {
  const route = endpoint();
  const response = await route.post({ startDate: '2026-11-16' });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(route.state.generationArguments?.[4], undefined);
  assert.equal(body.summary.weeks.length, 22);
  assert.ok(route.state.savedWorkouts.some(workout => workout.phase === 'race'));
  assert.ok(route.state.savedWorkouts.some(workout => workout.phase === 'transition'));
  assert.equal(route.state.createdPlan.summary.weeks.length, 22);
  assert.equal(route.state.createdPlan.raceId,'prova-a');
  assert.equal(route.state.archives, 1);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('handler passa objetivo e modo FC antes de gerar e persiste os blocos em bpm', async () => {
  const route = endpoint();
  const response = await route.post({ startDate: '2026-11-16', weeks: 8, goal: '5k', structure: 'zona' });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(route.state.generationArguments?.[0]?.trainingGoal, '5k');
  assert.equal(route.state.generationArguments?.[0]?.runStructure, 'zona');
  assert.equal(body.summary.goal, '5k');
  assert.equal(route.state.createdPlan.summary.goal, '5k');
  assert.equal(route.state.profileUpdate.runStructure, 'zona');
  const running = route.state.savedWorkouts.filter(workout => workout.modality === 'corrida');
  assert.ok(running.length > 0);
  assert.ok(running.every(workout => workout.structure.steps.every((step: any) => step.target.unit === 'bpm' && step.distanceMeters == null)));
});

test('handler passa modo distância e mantém estimativas coerentes com o limiar de pace', async () => {
  const route = endpoint();
  assert.equal((await route.post({ startDate: '2026-11-16', weeks: 6, goal: '42k', structure: 'distancia' })).status, 200);
  assert.equal(route.state.createdPlan.summary.goal, '42k');
  assert.ok(route.state.savedWorkouts.some(workout => workout.modality === 'corrida' && workout.structure.steps.some((step: any) => step.target.unit === 's/km' && step.distanceMeters > 0)));
});

test('handler recusa opções incompatíveis sem arquivar o plano anterior', async () => {
  for (const body of [{ goal: 'ironman' }, { goal: 'inventado' }, { structure: 'livre' }, { weeks: 53 }, { weeks: 0 }, { startDate: '2027-02-30' }]) {
    const route = endpoint();
    assert.equal((await route.post(body)).status, 422);
    assert.equal(route.state.archives, 0);
    assert.equal(route.state.generationArguments, null);
  }
});

test('handler exige sessão, triagem e autorização antes de substituir planos', async () => {
  const anonymous = endpoint({ user: null });
  assert.equal((await anonymous.post({})).status, 401);
  assert.equal(anonymous.state.archives, 0);
  const incomplete = endpoint({ savedProfile: { ...profile, birthDate: null } });
  assert.equal((await incomplete.post({})).status, 422);
  assert.equal(incomplete.state.archives, 0);
  const other = endpoint();
  assert.equal((await other.post({ targetUserId: 'outro-atleta' })).status, 403);
  assert.equal(other.state.archives, 0);
});
