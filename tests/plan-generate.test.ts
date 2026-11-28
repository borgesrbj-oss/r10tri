import {preparationIssues,thresholdMinutes} from '../lib/training-audit';
import { assessmentIssue } from '../lib/assessment-review';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import * as training from '../lib/training-structure';
import { assessmentReadiness } from '../lib/assessment-validation';
import { trainingFeedback } from '../lib/training-feedback';
import { TRAINING_GOALS } from '../lib/training-goals';
import type { TrainingProfile, TrainingRace } from '../lib/training-types';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = ts.transpileModule(
  fs.readFileSync(path.join(root, 'app/api/plan/generate/route.ts'), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  },
).outputText;
const profile = {
  birthDate: new Date('1990-01-01T12:00:00Z'),
  currentWeight: 70,
  level: 'intermediario',
  modality: 'corrida',
  weeklyHours: 6,
  currentWeeklyVol: 5,
  planningPreferences:{recentMinutes:{corrida:300},recentLongRunMinutes:75},
  availableDays: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
  runThresholdPace: '05:00',
  thresholdHeartRate: 170,
  maxHeartRate: 190,
  hasHRM: true,
};

function endpoint({
  savedProfile = profile as TrainingProfile,
  savedRaces,
  user = { id: 'atleta-atual', role: 'atleta' } as {
    id: string;
    role: string;
  } | null,
}: { savedProfile?: TrainingProfile; savedRaces?: TrainingRace[]; user?: { id: string; role: string } | null } = {}) {
  const state = {
    archives: 0,
    createdPlan: null as any,
    savedWorkouts: [] as any[],
    profileUpdate: null as any,
    generationArguments: null as Parameters<
      typeof training.generateStructuredPlan
    > | null,
  };
  const database = {
    athleteProfile: {
      findUnique: async () => savedProfile,
      update: async ({ data }: any) => {
        state.profileUpdate = data;
        return data;
      },
    },
    targetRace: {
      findMany: async () => savedRaces ?? [
        {
          id: 'prova-b',
          name: 'Prova secundária',
          date: new Date('2026-12-01T12:00:00Z'),
          distance: '5k',
          priority: 'B',
        },
        {
          id: 'prova-a',
          name: 'Prova-alvo',
          date: new Date('2027-04-05T12:00:00Z'),
          distance: '42k',
          priority: 'A',
        },
      ],
    },
    trainingPlan: {
      updateMany: async () => {
        state.archives++;
        return { count: 1 };
      },
      create: async ({ data }: any) => {
        state.createdPlan = { id: 'novo-plano', ...data };
        return state.createdPlan;
      },
    },
    workoutLog: { findMany: async () => [] },
    workout: {
      count: async () => 0,
      findMany: async () => [],
      createMany: async ({ data }: any) => {
        state.savedWorkouts = data;
        return { count: data.length };
      },
    },
  };
  const prisma = {
    ...database,
    $transaction: async (
      callback: (transaction: typeof database) => Promise<unknown>,
    ) => callback(database),
  };
  const dependencies: Record<string, unknown> = {
    'node:crypto': { createHash },
    'next/server': {
      NextResponse: {
        json: (body: unknown, options?: ResponseInit) =>
          Response.json(body, options),
      },
    },
    '@/auth': { auth: async () => (user ? { user } : null) },
    '@/lib/db': { prisma },
    '@/lib/coach-access': {
      canAccessAthlete: async (actor: any, id: string) => actor.id === id,
    },
    '@/lib/plan-engine': {
      generateNutrition: () => 'Orientações gerais de alimentação.',
    },
    '@/lib/assessment-validation': { assessmentReadiness },
    '@/lib/assessment-review': { assessmentIssue },
    '@/lib/training-audit': {preparationIssues,thresholdMinutes},
    '@/lib/training-feedback': { trainingFeedback },
    '@/lib/training-goals': { TRAINING_GOALS },
    '@/lib/training-structure': {
      ...training,
      generateStructuredPlan: (
        ...args: Parameters<typeof training.generateStructuredPlan>
      ) => {
        state.generationArguments = args;
        return training.generateStructuredPlan(...args);
      },
    },
  };
  const sandboxModule = { exports: {} };
  vm.runInNewContext(
    source,
    {
      module: sandboxModule,
      exports: sandboxModule.exports,
      require: (name: string) => {
        if (!(name in dependencies))
          throw new Error(`Dependência não simulada: ${name}`);
        return dependencies[name];
      },
      Response,
      Date,
    },
    { filename: 'app/api/plan/generate/route.ts' },
  );
  const handler = sandboxModule.exports as {
    POST: (request: Request) => Promise<Response>;
  };
  return {
    state,
    post: (body: unknown) =>
      handler.POST(
        new Request('https://app.example/api/plan/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      ),
  };
}

test('prévia e gravação de maratona em 12 semanas confirmam a prova de 42 km e os três estímulos', async () => {
  const marathon = { id: 'maratona', date: '2027-05-09', distance: '42,195 km', priority: 'B' };
  const otherRace = { id: 'prova-curta', date: '2027-03-07', distance: '5k', priority: 'A' };
  for (const mode of ['distancia','zona'] as const) {
    const route = endpoint({
      savedRaces: [otherRace, marathon],
      savedProfile: { ...profile, runStructure: mode, trainingGoal: '42k', currentWeeklyVol: 0,
        limitations: 'Treino na esteira durante a semana', currentInjuries:'Sem lesão atual', medicalConditions: 'Sem condições médicas' },
    });
    const options = { startDate:'2027-02-15', weeks:12 };
    const response = await route.post({ ...options, preview:true });
    assert.equal(response.status, 200);
    const preview = await response.json();
    assert.equal(preview.goal, '42k');
    assert.ok(preview.warnings.some((warning:string) => warning.includes('Prazo curto')));
    assert.deepEqual(preview.qualityExamples.map((example:{title:string}) => example.title), ['Tiros','Fartlek','Ritmo sustentado']);
    assert.ok(preview.runningIntensity.at > 0 && preview.runningIntensity.above > 0);
    assert.equal(preview.runningIntensity.unknown, 0);
    assert.equal(route.state.archives, 0);
    const confirm = await route.post({ ...options, previewToken:preview.previewToken });
    assert.equal(confirm.status, 200);
    assert.equal(route.state.createdPlan.raceId, marathon.id);
    assert.equal(route.state.savedWorkouts.length, preview.workoutsCount);
    assert.ok(route.state.savedWorkouts.every(workout => workout.date.toISOString().slice(0,10) !== marathon.date));
    assert.ok(route.state.savedWorkouts.some(workout => workout.title.startsWith('Longo')));
    for (const workout of route.state.savedWorkouts.filter(w => /^Tiros|^Fartlek|^Ritmo/.test(w.title))) {
      assert.ok(workout.structure.steps.some((step:{kind:string}) => step.kind === 'aquecimento'));
      assert.ok(workout.structure.steps.some((step:{kind:string}) => step.kind === 'desaquecimento'));
      const principal = workout.structure.steps.find((step:{zone:string}) => ['Z4','Z5'].includes(step.zone));
      assert.equal(principal.target.unit, mode === 'zona' ? 'bpm' : 's/km');
      if (mode === 'distancia') assert.ok(principal.distanceMeters > 0);
    }
  }
});

test('a prova de maratona inferida valida triagem antes de gravar e permanece como foco após confirmar', async () => {
  const savedRaces = [{ id:'maratona', date:'2027-05-09', distance:'Maratona', priority:'A' }];
  const options = { startDate:'2027-02-15', weeks:12 };
  const incomplete = endpoint({ savedRaces, savedProfile: { ...profile, planningPreferences: { recentMinutes: { corrida: 300 } } } });
  const failed = await incomplete.post({ ...options, preview:true });
  assert.equal(failed.status, 422);
  assert.ok((await failed.json()).assessmentIssues.some((issue:{field:string}) => issue.field === 'planningPreferences.recentLongRunMinutes'));
  assert.equal(incomplete.state.archives, 0);
  const complete = endpoint({ savedRaces });
  assert.equal((await complete.post(options)).status, 200);
  assert.equal(complete.state.profileUpdate.trainingGoal,'42k');
});

test('triatlo com agenda parcial gera prévia com três modalidades e séries antes de gravar', async () => {
  const route = endpoint({ savedProfile: {
    ...profile, modality: 'triatlo', hasPoolAccess: true, canSwim: true,
    swimCssPace: '02:00', ftp: 220, swimLevel: 'intermediario',
    daySchedule: JSON.stringify({ seg: ['ciclismo'], qua: ['corrida'] }),
    planningPreferences: { recentMinutes: { natacao: 80, ciclismo: 190, corrida: 130 } },
  } });
  const options = { startDate: '2027-01-04', weeks: 10 };
  const response = await route.post({ ...options, preview: true });
  assert.equal(response.status, 200);
  const preview = await response.json();
  assert.ok(preview.highMinutes > 0);
  assert.ok(preview.sports.some((sport: {modality:string}) => sport.modality === 'natacao'));
  assert.equal(route.state.archives, 0);
  const stale = await route.post({ ...options, weeks: 8, previewToken: preview.previewToken });
  assert.equal(stale.status, 409);
  assert.equal(route.state.archives, 0);
  const confirmed = await route.post({ ...options, previewToken: preview.previewToken });
  assert.equal(confirmed.status, 200);
  assert.equal(route.state.archives, 1);
  assert.equal(route.state.savedWorkouts.length, preview.workoutsCount);
  for (const label of ['Tiros', 'Fartlek', 'Ritmo sustentado']) {
    const item = route.state.savedWorkouts.find(workout => workout.modality === 'corrida' && workout.title.includes(label));
    assert.ok(item, label);
    assert.ok(item.structure.steps.some((step: {zone:string}) => ['Z4', 'Z5'].includes(step.zone)));
  }
});

test('triatlo impossível de encaixar natação indica agenda e preserva o plano ativo', async () => {
  const route = endpoint({ savedProfile: {
    ...profile, modality: 'triatlo', hasPoolAccess: true, canSwim: true,
    daySchedule: JSON.stringify({ seg: ['ciclismo'], qua: ['corrida'] }),
    availableDays: ['seg', 'qua'],
    planningPreferences: { recentMinutes: { natacao: 80, ciclismo: 190, corrida: 130 }, doubleDays: [] },
  } });
  const response = await route.post({ startDate: '2027-01-04', weeks: 8 });
  assert.equal(response.status, 422);
  assert.equal(route.state.archives, 0);
  const data = await response.json();
  assert.ok(data.assessmentIssues.some((issue: {field:string,message:string}) => issue.field === 'daySchedule' && issue.message.includes('Natação')));
});

test('handler preserva Auto omitido e salva prova, transição e resumo de 22 semanas', async () => {
  const route = endpoint();
  const response = await route.post({ startDate: '2026-11-16' });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(route.state.generationArguments?.[4], undefined);
  assert.equal(body.summary.weeks.length, 22);
  assert.ok(
    route.state.savedWorkouts.some((workout) => workout.phase === 'race'),
  );
  assert.ok(
    route.state.savedWorkouts.some((workout) => workout.phase === 'transition'),
  );
  assert.equal(route.state.createdPlan.summary.weeks.length, 22);
  assert.equal(route.state.createdPlan.raceId, 'prova-a');
  assert.equal(route.state.archives, 1);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('handler passa objetivo e modo FC antes de gerar e persiste os blocos em bpm', async () => {
  const route = endpoint();
  const response = await route.post({
    startDate: '2026-11-16',
    weeks: 8,
    goal: '5k',
    structure: 'zona',
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(route.state.generationArguments?.[0]?.trainingGoal, '5k');
  assert.equal(route.state.generationArguments?.[0]?.runStructure, 'zona');
  assert.equal(body.summary.goal, '5k');
  assert.equal(route.state.createdPlan.summary.goal, '5k');
  assert.equal(route.state.profileUpdate.runStructure, 'zona');
  assert.equal(route.state.profileUpdate.trainingGoal, '5k');
  const running = route.state.savedWorkouts.filter(
    (workout) => workout.modality === 'corrida',
  );
  assert.ok(running.length > 0);
  assert.ok(
    running.every((workout) =>
      workout.structure.steps.every(
        (step: any) =>
          step.target.unit === 'bpm' && step.distanceMeters == null,
      ),
    ),
  );
});

test('geração após triagem reutiliza foco salvo sem exigir seleção novamente', async () => {
  const route = endpoint({ savedProfile: { ...profile, trainingGoal: '5k' } });
  assert.equal(
    (await route.post({ weeks: 4, startDate: '2026-11-16' })).status,
    200,
  );
  assert.equal(route.state.createdPlan.summary.goal, '5k');
  assert.equal(route.state.generationArguments?.[0]?.trainingGoal, '5k');
});

test('handler passa modo distância e mantém estimativas coerentes com o limiar de pace', async () => {
  const route = endpoint();
  assert.equal(
    (
      await route.post({
        startDate: '2026-11-16',
        weeks: 6,
        goal: '42k',
        structure: 'distancia',
      })
    ).status,
    200,
  );
  assert.equal(route.state.createdPlan.summary.goal, '42k');
  assert.ok(
    route.state.savedWorkouts.some(
      (workout) =>
        workout.modality === 'corrida' &&
        workout.structure.steps.some(
          (step: any) => step.target.unit === 's/km' && step.distanceMeters > 0,
        ),
    ),
  );
});

test('handler recusa opções incompatíveis sem arquivar o plano anterior', async () => {
  for (const body of [
    { goal: 'ironman' },
    { goal: 'inventado' },
    { structure: 'livre' },
    { weeks: 53 },
    { weeks: 0 },
    { startDate: '2027-02-30' },
  ]) {
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
  const incomplete = endpoint({
    savedProfile: { ...profile, birthDate: null },
  });
  assert.equal((await incomplete.post({})).status, 422);
  assert.equal(incomplete.state.archives, 0);
  const other = endpoint();
  assert.equal(
    (await other.post({ targetUserId: 'outro-atleta' })).status,
    403,
  );
  assert.equal(other.state.archives, 0);
});


test('geração identifica o campo exato e preserva o plano quando falta triagem',async()=>{
 const route=endpoint({savedProfile:{...profile,birthDate:null,currentWeight:0}});
 const response=await route.post({});
 assert.equal(response.status,422);
 const body=await response.json();
 assert.equal(body.assessmentIssues[0].field,'birthDate');
 assert.equal(body.assessmentIssues[0].step,4);
 assert.equal(body.assessmentIssues[1].field,'currentWeight');
 assert.equal(route.state.archives,0);
});
test('sem sessões viáveis aponta os limites diários e horas para revisão',async()=>{
 const route=endpoint({savedProfile:{...profile,availableDays:['seg'],dailyMinutes:{seg:0}}});
 const response=await route.post({weeks:1,startDate:'2027-01-04'});
 assert.equal(response.status,422);
 const body=await response.json();
 assert.ok(body.assessmentIssues.some((issue:any)=>issue.field==='dailyMinutes.seg'));
 assert.equal(route.state.archives,0);
});
test('opções de geração inválidas não são rotuladas como erro de triagem',async()=>{
 const response=await endpoint().post({weeks:53});
 assert.equal(response.status,422);
 assert.equal((await response.json()).assessmentIssues,undefined);
});

test('km sem pace aponta a triagem e preserva o plano, sem voltar silenciosamente para minutos',async()=>{
 const route=endpoint({savedProfile:{...profile,runThresholdPace:null}});
 const response=await route.post({structure:'distancia'});assert.equal(response.status,422);
 assert.equal((await response.json()).assessmentIssues[0].field,'runThresholdPace');assert.equal(route.state.archives,0);
});
test('preferência km salva na triagem é reutilizada sem opções adicionais',async()=>{
 const route=endpoint({savedProfile:{...profile,runStructure:'distancia'}});
 assert.equal((await route.post({weeks:1})).status,200);
 assert.ok(route.state.savedWorkouts.filter(w=>w.modality==='corrida').every(w=>w.structure.prescriptionMode==='distancia'));
});

test('prévia de triatlo identifica separadamente os campos de volume recente', async () => {
  const route = endpoint({ savedProfile: { ...profile, hasPoolAccess: true } });
  const response = await route.post({ modality: 'triatlo', startDate: '2027-01-04', preview: true });
  assert.equal(response.status, 422);
  const data = await response.json();
  const fields = data.assessmentIssues.map((issue: {field:string}) => issue.field);
  assert.ok(fields.includes('planningPreferences.recentMinutes.natacao'));
  assert.ok(fields.includes('planningPreferences.recentMinutes.ciclismo'));
  assert.match(data.error, /natacao/);
  assert.match(data.error, /ciclismo/);
  assert.equal(route.state.archives, 0);
});
