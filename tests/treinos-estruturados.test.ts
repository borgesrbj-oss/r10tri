import test from 'node:test';
import assert from 'node:assert/strict';
import { generateFallbackPlan, generateNutrition, thresholdFrom3k } from '../lib/plan-engine';
import { buildWorkoutStructure, calendarDay, generateStructuredPlan, readWorkoutStructure } from '../lib/training-structure';
import { cssFromTests, parsePaceSeconds, targetForZone } from '../lib/training-zones';
import type { TrainingProfile } from '../lib/training-types';

const days = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const profile: TrainingProfile = { level: 'intermediario', modality: 'triatlo', weeklyHours: 6, currentWeeklyVol: 5, ftp: 200, hasPowerMeter: true, runThresholdPace: '05:00', swimCssPace: '02:00', birthDate: '1990-01-01', currentWeight: 70 };
const start = '2026-11-16';

test('não presume dias nem disponibilidade semanal ausentes', () => {
  assert.equal(generateStructuredPlan(profile, [], [], start, 4).workouts.length, 0);
  assert.equal(generateStructuredPlan({ ...profile, weeklyHours: undefined }, [], days, start, 4).workouts.length, 0);
  assert.equal(generateStructuredPlan({ ...profile, weeklyHours: 0 }, [], days, start, 4).workouts.length, 0);
  assert.equal(generateStructuredPlan({ ...profile, weeklyHours: -1 }, [], days, start, 4).workouts.length, 0);
});

test('respeita quatro semanas e dias do calendário mesmo com início numa quarta', () => {
  const plan = generateStructuredPlan({ ...profile, modality: 'corrida' }, [], ['seg', 'qua', 'sex'], '2026-11-18', 4);
  assert.equal(plan.summary.weeks.length, 4);
  assert.ok(plan.workouts.length > 0);
  const first = calendarDay('2026-11-18')!.getTime();
  for (let index = 0; index < plan.workouts.length; index++) {
    const workout = plan.workouts[index];
    const date = new Date(workout.date);
    assert.ok([1, 3, 5].includes(date.getUTCDay()));
    assert.ok(date.getTime() >= first && date.getTime() < first + 28 * 86_400_000);
    if (index) assert.ok(workout.date >= plan.workouts[index - 1].date);
  }
});

test('orçamento de quinze minutos não vira quarenta nem cria terça indisponível', () => {
  const plan = generateStructuredPlan({ ...profile, modality: 'corrida', weeklyHours: 0.25, currentWeeklyVol: 0.25 }, [], ['seg'], start, 4);
  assert.ok(plan.workouts.length > 0);
  assert.ok(plan.workouts.every(workout => new Date(workout.date).getUTCDay() === 1));
  assert.ok(plan.summary.weeks.every(week => week.plannedMinutes <= 15 && week.plannedMinutes <= week.budgetMinutes));
});

test('agenda explícita não autoriza modalidades em dias indisponíveis', () => {
  const plan = generateStructuredPlan({ ...profile, daySchedule: JSON.stringify({ seg: ['corrida', 'forca'], ter: ['ciclismo'] }) }, [], ['seg'], start, 4);
  assert.ok(plan.workouts.every(workout => new Date(workout.date).getUTCDay() === 1));
  assert.ok(plan.workouts.some(workout => workout.modality === 'forca'));
  assert.ok(plan.warnings.some(warning => warning.includes('dias indisponíveis')));
});

test('somatório dos passos corresponde à duração, ao orçamento e à distribuição real', () => {
  const plan = generateStructuredPlan(profile, [], days, start, 12);
  for (const workout of plan.workouts) {
    assert.equal(workout.structure.steps.reduce((sum, step) => sum + step.durationSeconds, 0), workout.duration * 60);
    assert.equal(workout.structure.durationSeconds, workout.duration * 60);
    assert.ok(workout.structure.steps.every(step => Number.isInteger(step.durationSeconds) && step.durationSeconds > 0));
    for (const kind of ['aquecimento', 'principal', 'desaquecimento']) assert.ok(workout.structure.steps.some(step => step.kind === kind));
    assert.ok(readWorkoutStructure(workout.structure));
  }
  for (const week of plan.summary.weeks) {
    assert.ok(week.plannedMinutes <= Number(profile.weeklyHours) * 60);
    assert.ok(week.plannedMinutes <= week.budgetMinutes);
    assert.ok(week.distribution.highFraction <= 0.2 + 0.000001);
    assert.equal(week.distribution.moderateSeconds, 0);
    assert.equal(week.distribution.totalSeconds, week.distribution.enduranceSeconds + week.distribution.restSeconds + week.distribution.strengthSeconds);
  }
  assert.equal(plan.summary.distribution.totalSeconds, plan.workouts.reduce((sum, workout) => sum + workout.duration * 60, 0));
});

test('semanas elegíveis aproximam 80/20 sem contar força como aeróbico', () => {
  const plan = generateStructuredPlan(profile, [], days, start, 12);
  const eligible = plan.summary.weeks.filter(week => week.targetHighFraction === 0.2);
  assert.ok(eligible.length > 0);
  assert.ok(eligible.some(week => week.distribution.highFraction >= 0.175));
  for (const week of eligible) if (week.distribution.highFraction < 0.175) assert.ok(week.warnings.some(warning => warning.includes('reduzido')));
  assert.ok(plan.summary.distribution.strengthSeconds > 0);
});

test('não agenda intensidade em dias seguidos, incluindo fronteira entre semanas', () => {
  const plan = generateStructuredPlan(profile, [], days, start, 20);
  const intense = plan.workouts.filter(workout => workout.structure.distribution.highSeconds > 0);
  assert.ok(intense.length > 0);
  for (let index = 1; index < intense.length; index++) assert.ok(new Date(intense[index].date).getTime() - new Date(intense[index - 1].date).getTime() >= 2 * 86_400_000);
});

test('adaptação, recuperação e sinal de lesão não são compensados com esforço extra', () => {
  const healthy = generateStructuredPlan(profile, [], days, start, 8);
  assert.ok(healthy.summary.weeks.slice(0, 2).every(week => week.distribution.highSeconds === 0));
  assert.ok(healthy.summary.weeks.filter(week => week.recovery).every(week => week.distribution.highSeconds === 0));
  const injured = generateStructuredPlan({ ...profile, currentInjuries: 'Dor no joelho' }, [], days, start, 8);
  assert.equal(injured.summary.requiresCoachReview, true);
  assert.ok(injured.workouts.every(workout => workout.structure.requiresCoachReview));
  assert.ok(injured.workouts.every(workout => workout.structure.distribution.highSeconds === 0));
  assert.ok(injured.warnings.some(warning => warning.includes('treinador deve revisar')));
  assert.ok(injured.workouts.every(workout => !workout.description.includes('PROTOCOLO SEGURO PARA JOELHO')));
});

test('periodiza em torno da prova real e reserva o dia da competição', () => {
  const raceDate = '2027-03-07';
  const plan = generateStructuredPlan(profile, [{ name: 'Prova-alvo', date: raceDate }], days, start, 24);
  const phases = new Set(plan.workouts.map(workout => workout.phase));
  for (const phase of ['base', 'build', 'peak', 'race', 'transition'] as const) assert.ok(phases.has(phase));
  assert.ok(plan.workouts.every(workout => workout.date.slice(0, 10) !== raceDate));
  assert.ok(plan.workouts.filter(workout => workout.phase === 'transition').every(workout => workout.structure.distribution.highSeconds === 0));
});

test('sem prova real não inventa competição nem fase Race', () => {
  const plan = generateStructuredPlan(profile, [], days, start, 12);
  assert.ok(plan.workouts.every(workout => workout.phase !== 'race' && workout.phase !== 'transition'));
  assert.ok(plan.warnings.some(warning => warning.includes('Sem prova-alvo')));
});

test('sem acesso à água não cria natação nem substituição escondida', () => {
  const plan = generateStructuredPlan({ ...profile, hasPoolAccess: false }, [], days, start, 6);
  assert.ok(plan.workouts.every(workout => workout.modality !== 'natacao'));
  assert.ok(plan.warnings.some(warning => warning.includes('Sem acesso à natação')));
  assert.equal(generateStructuredPlan({ ...profile, modality: 'natacao', canSwim: false }, [], days, start, 6).workouts.length, 0);
});

test('metas específicas usam FTP, CSS e limiar explícitos; sem dados usam percepção', () => {
  assert.deepEqual([targetForZone(profile, 'ciclismo', 'Z2').low, targetForZone(profile, 'ciclismo', 'Z2').high], [112, 150]);
  assert.equal(targetForZone(profile, 'natacao', 'Z4').unit, 's/100m');
  assert.equal(targetForZone(profile, 'corrida', 'Z4').unit, 's/km');
  for (const modality of ['corrida', 'natacao', 'ciclismo'] as const) assert.equal(targetForZone({}, modality, 'Z2').unit, 'RPE');
  assert.equal(targetForZone({ testRun3km: '14:30' }, 'corrida', 'Z4').unit, 'RPE');
  assert.equal(targetForZone({ ftp: 200, hasPowerMeter: false, hasTrainer: false }, 'ciclismo', 'Z2').unit, 'RPE');
});

test('CSS valida testes e não aceita ritmos impossíveis ou campos inválidos', () => {
  assert.equal(cssFromTests('07:00', '03:20'), 110);
  assert.equal(cssFromTests('02:00', '03:20'), null);
  assert.equal(cssFromTests('06:00', '03:20'), null);
  assert.equal(parsePaceSeconds('05:99'), null);
  assert.equal(parsePaceSeconds('-5:00'), null);
  assert.equal(parsePaceSeconds('NaN'), null);
});

test('JSON persistido adulterado não altera somatórios nem gera passo inválido', () => {
  const structure = buildWorkoutStructure(profile, 'corrida', 'build', 45, 12 * 60);
  const changed = structuredClone(structure);
  changed.distribution.highSeconds = 999999;
  assert.equal(readWorkoutStructure(changed)?.distribution.highSeconds, structure.distribution.highSeconds);
  changed.steps[0].durationSeconds = -1;
  assert.equal(readWorkoutStructure(changed), null);
  assert.equal(readWorkoutStructure({ version: 1, steps: [] }), null);
});

test('utilitários legados permanecem e não inventam peso para nutrição', () => {
  assert.equal(thresholdFrom3k('14:30'), 308);
  const workouts = generateFallbackPlan(profile, [], days, start, 4);
  assert.ok(workouts.length > 0 && workouts.every(workout => workout.structure.version === 1));
  const guide = generateNutrition({});
  assert.ok(guide.includes('Peso não informado'));
  assert.equal(guide.includes('base: 70 kg'), false);
});

test('Auto inclui prova além de 12 semanas e transição sem truncar; horizonte é explícito', () => {
  const races = [{date:'2027-04-05',name:'Prova de referência'}];
  const auto = generateStructuredPlan(profile, races, days, start);
  assert.equal(auto.summary.weeks.length, 22);
  assert.ok(auto.workouts.some(workout => workout.phase === 'race'));
  assert.ok(auto.workouts.some(workout => workout.phase === 'transition'));
  assert.equal(generateStructuredPlan(profile, [], days, start, 52).summary.weeks.length, 52);
  const beyond = generateStructuredPlan(profile, [{date:'2028-04-05'}], days, start);
  assert.equal(beyond.workouts.length, 0);
  assert.ok(beyond.warnings.some(warning => warning.includes('52 semanas')));
});

test('objetivo altera alocação e intervalos, preservando orçamento e recuperação', () => {
  const short = generateStructuredPlan({...profile,modality:'corrida',trainingGoal:'5k'},[],days,start,12);
  const long = generateStructuredPlan({...profile,modality:'corrida',trainingGoal:'42k'},[],days,start,12);
  assert.equal(short.summary.goal, '5k');
  assert.equal(long.summary.goal, '42k');
  const shortLast = short.workouts.find(workout => workout.weekNumber === 1 && new Date(workout.date).getUTCDay() === 6)!;
  const longLast = long.workouts.find(workout => workout.weekNumber === 1 && new Date(workout.date).getUTCDay() === 6)!;
  assert.ok(longLast.duration > shortLast.duration);
  assert.ok(short.workouts.some(workout => workout.phase === 'build' && workout.structure.steps.some(step => step.zone === 'Z5')));
  assert.ok(long.workouts.filter(workout => workout.phase === 'build').every(workout => workout.structure.steps.every(step => step.zone !== 'Z5')));
  assert.ok(long.summary.weeks.every(week => week.plannedMinutes <= 360 && week.distribution.highFraction <= .2));
});

test('modo FC usa limiar funcional e modo distância usa pace sem inventar medições', () => {
  const heart = {...profile,modality:'corrida',runStructure:'zona',thresholdHeartRate:170,maxHeartRate:190,hasHRM:true};
  const zone = targetForZone(heart,'corrida','Z2');
  assert.deepEqual([zone.unit,zone.low,zone.high],['bpm',133,147]);
  const fc = buildWorkoutStructure(heart,'corrida','build',45,600);
  assert.ok(readWorkoutStructure(fc));
  assert.ok(fc.steps.every(step => step.target.unit === 'bpm' && step.distanceMeters == null));
  const distance = buildWorkoutStructure({...heart,runStructure:'distancia'},'corrida','build',45,600);
  assert.ok(distance.steps.some(step => step.target.unit === 's/km' && step.distanceMeters! > 0));
  assert.equal(targetForZone({...heart,hasHRM:false},'corrida','Z2').unit,'s/km');
  assert.equal(targetForZone({runStructure:'zona'},'corrida','Z2').unit,'RPE');
  assert.equal(targetForZone({...heart,maxHeartRate:100},'corrida','Z5').unit,'s/km');
  assert.equal(targetForZone({...heart,restingHeartRate:175},'corrida','Z5').unit,'s/km');
});
