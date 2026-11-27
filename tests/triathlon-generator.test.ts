import assert from 'node:assert/strict';
import { test } from 'node:test';
import { auditPolarizedDistribution } from '../lib/polarized-distribution';
import { buildWorkoutStructure, combineDistributions, distributionForSteps, generateStructuredPlan, readWorkoutStructure } from '../lib/training-structure';
import { cycleStart, observedFeedback, triathlonMatrix } from './fixtures/triathlon-matrix';

const cases = triathlonMatrix();

test('120 perfis fixados por semente verificam a meta semanal e do ciclo, horas e cinco segmentos', () => {
  assert.equal(cases.length, 120);
  assert.equal(new Set(cases.map(c => c.format + c.level)).size, 12);
  let passing = 0;
  for (const entry of cases) {
    const { profile, race, days, weeks } = entry;
    const plan = generateStructuredPlan(profile, [race], days, cycleStart, weeks, observedFeedback);
    assert.ok(plan.workouts.length, race.id);
    assert.equal(plan.summary.weeks.length, weeks, race.id);
    assert.equal(plan.summary.raceId, race.id);
    assert.equal(plan.summary.raceTarget?.status, 'ready', race.id);
    const goal = plan.summary.raceTarget;
    if (goal?.status !== 'ready') continue;
    assert.equal(goal.segments.length, 5);
    assert.equal(goal.totalSeconds, goal.segments.reduce((sum, segment) => sum + segment.seconds!, 0));
    assert.ok(Math.abs(goal.totalSeconds - goal.goalSeconds!) / goal.goalSeconds! <= 0.02);
    for (const part of goal.segments) {
      assert.ok(part.range && part.seconds! >= part.range.minSeconds && part.seconds! <= part.range.maxSeconds);
    }
    let previous: number | null = null;
    let allWeeksPass = true;
    const groups = new Map<string, typeof plan.workouts>();
    const demanding: string[] = [];
    for (const week of plan.summary.weeks) {
      const workouts = plan.workouts.filter(workout => workout.weekNumber === week.weekNumber);
      const combined = combineDistributions(workouts.map(workout => distributionForSteps(workout.structure.steps, workout.structure.modality)));
      assert.equal(combined.totalSeconds, week.plannedMinutes * 60);
      assert.ok(week.plannedMinutes <= Number(profile.weeklyHours) * 60, race.id);
      if (previous !== null) assert.ok(week.plannedMinutes * 10 <= previous * 11, race.id);
      previous = week.plannedMinutes;
      assert.equal(week.polarization?.window === 'polimento' || week.recovery, Boolean(week.reduction));
      if (week.reduction) {
        const { referenceMinutes, fraction, kind } = week.reduction;
        assert.equal(fraction, (referenceMinutes - week.plannedMinutes) / referenceMinutes);
        assert.ok(kind === 'descarga' ? fraction >= 0.3 && fraction <= 0.4 : fraction >= 0.4 && fraction <= 0.6, race.id);
      }
      const audit = auditPolarizedDistribution(combined, week.polarization!.window);
      assert.deepEqual(week.polarization, audit);
      allWeeksPass &&= audit.status === 'na_faixa';
      for (const workout of workouts) {
        assert.ok(workout.date.slice(0, 10) < String(race.date), race.id);
        assert.ok(readWorkoutStructure(workout.structure), workout.title);
        if (workout.brickGroupKey) {
          const group = groups.get(workout.brickGroupKey) ?? [];
          group.push(workout);
          groups.set(workout.brickGroupKey, group);
        }
        if (!workout.structure.distribution.highSeconds) continue;
        demanding.push(workout.date);
        assert.equal(workout.structure.steps[0].kind, 'aquecimento');
        assert.equal(workout.structure.steps[workout.structure.steps.length - 1].kind, 'desaquecimento');
      }
    }
    for (const workout of groups.values()) assert.deepEqual(workout.map(session => session.modality), ['ciclismo', 'descanso', 'corrida']);
    for (let index = 1; index < demanding.length; index++) assert.ok(Date.parse(demanding[index]) - Date.parse(demanding[index - 1]) >= 2 * 86400000);
    const checked = auditPolarizedDistribution(plan.summary.distribution, 'ciclo');
    assert.deepEqual(plan.summary.polarization, checked);
    passing += Number(allWeeksPass && checked.status === 'na_faixa');
    const again = generateStructuredPlan(profile, [race], days, cycleStart, weeks, observedFeedback);
    assert.deepEqual(plan, again);
  }
  assert.ok(passing >= 114, passing + ' de 120 satisfizeram todas as faixas');
});

test('brick ordenado tem transição passiva e só é prescrito quando cabe completo', () => {
  const { profile, race, weeks } = cases.find(entry => entry.level === 'intermediario' && entry.format === 'olimpico')!;
  const days = ['seg','ter','qua','qui','sex','sab'];
  const planned = { ...profile, planningPreferences: { ...profile.planningPreferences as object, doubleDays: ['sab'], preferred: { brick: ['sab'] } } };
  const good = generateStructuredPlan(planned, [race], days, cycleStart, weeks, observedFeedback);
  const transition = good.workouts.find(workout => workout.structure.transition === 'T2')!;
  assert.ok(transition);
  assert.equal(transition.structure.distribution.enduranceSeconds, 0);
  assert.deepEqual(good.workouts.filter(workout => workout.brickGroupKey === transition.brickGroupKey).map(workout => workout.partOrder), [0, 1, 2]);
  const capped = generateStructuredPlan({ ...planned, dailyMinutes: { sab: 15 } }, [race], days, cycleStart, weeks, observedFeedback);
  assert.equal(capped.workouts.some(workout => workout.brickGroupKey), false);
  assert.ok(capped.warnings.some(warning => warning.includes('Brick não encaixou completo')));
  for (const week of capped.summary.weeks) {
    const saturday = capped.workouts.filter(workout => workout.weekNumber === week.weekNumber && new Date(workout.date).getUTCDay() === 6);
    assert.ok(saturday.reduce((sum, workout) => sum + workout.duration, 0) <= 15);
  }
  assert.ok(readWorkoutStructure(transition.structure));
  assert.equal(readWorkoutStructure({ ...transition.structure, transition: 'T3' }), null);
  assert.equal(readWorkoutStructure({ ...transition.structure, modality: 'ciclismo' }), null);
});

test('restrição clínica pede avaliação e horário incompatível resulta em faixa não confirmada', () => {
  const { profile, race, days, weeks } = cases[0];
  const review = generateStructuredPlan({ ...profile, currentInjuries: 'Lesão atual informada' }, [race], days, cycleStart, weeks, observedFeedback);
  assert.equal(review.workouts.length, 0);
  assert.ok(review.summary.requiresCoachReview);
  assert.ok(review.warnings.some(warning => warning.includes('profissional de saúde')));
  const tight = generateStructuredPlan({ ...profile, weeklyHours: 0.5 }, [race], ['seg','qua'], cycleStart, weeks, observedFeedback);
  assert.notEqual(tight.summary.polarization?.status, 'na_faixa');
  assert.ok(tight.summary.weeks.every(week => week.plannedMinutes <= 30));
});

test('data no meio da semana separa a prova da transição e bloco curto fica indeterminado', () => {
  const { profile, race, days, weeks } = cases[0];
  const midweek = { ...race, date: '2027-03-25' };
  const full = generateStructuredPlan(profile, [midweek], days, cycleStart, undefined, observedFeedback);
  assert.equal(full.summary.weeks.find(week => week.weekNumber === weeks)?.phase, 'race');
  assert.equal(full.workouts.some(workout => workout.date.startsWith(midweek.date)), false);
  assert.ok(full.summary.weeks.slice(weeks).every(week => week.polarization?.window === 'pos-prova'));
  const block = generateStructuredPlan(profile, [midweek], days, cycleStart, 3, observedFeedback);
  assert.equal(block.summary.polarization?.status, 'indeterminado');
  const extra = generateStructuredPlan(profile, [midweek], days, cycleStart, 30, observedFeedback);
  assert.equal(extra.summary.weeks.length, weeks + 2);
  assert.ok(extra.warnings.some(warning => warning.includes('duas semanas de transição')));
});

test('repouso passivo fica fora dos minutos ativos e bloco ativo sem zona impede confirmação', () => {
  const structure = buildWorkoutStructure(null, 'corrida', 'base', 45, 540);
  const steps = [...structure.steps, { ...structure.steps[0], zone: null, durationSeconds: 180 }];
  const distribution = distributionForSteps(steps, structure.modality);
  const audit = auditPolarizedDistribution(distribution, 'regular');
  assert.equal(audit.activeSeconds, structure.distribution.enduranceSeconds + 180);
  assert.equal(audit.status, 'indeterminado');
  const exact = { ...structure.distribution, enduranceSeconds: 100, lowSeconds: 75, moderateSeconds: 10, highSeconds: 15 };
  assert.equal(auditPolarizedDistribution(exact, 'regular').status, 'fora_da_faixa');
});

test('prazo curto pede revisão sem zerar os estímulos para um triatleta com histórico', () => {
  const { profile, race } = cases.find(entry => entry.format === '70.3' && entry.level === 'intermediario')!;
  const plan = generateStructuredPlan(profile, [{ ...race, date: '2027-03-28' }], profile.availableDays!, cycleStart, 12, observedFeedback);
  assert.equal(plan.summary.requiresCoachReview, true);
  assert.ok(plan.warnings.some(warning => warning.includes('Prazo curto')));
  assert.ok(plan.workouts.some(workout => workout.modality === 'natacao'));
  assert.ok(plan.workouts.some(workout => workout.structure.distribution.highSeconds > 0));
});

test('prova B ajusta o entorno sem substituir a prova A e a natação em águas abertas mantém sua logística', () => {
  const { profile, race, days, weeks } = cases.find(entry => entry.format === 'olimpico' && entry.level === 'intermediario')!;
  const secondary = { id: 'secundaria', priority: 'B', name: 'Prova de corrida fictícia', distance: '10k', date: '2027-02-10' };
  const plan = generateStructuredPlan({ ...profile, poolSize: 'mar_aberto', hasPoolAccess: false, swimLevel: 'basico' }, [race, secondary], days, cycleStart, weeks, observedFeedback);
  assert.equal(plan.summary.raceId, race.id);
  assert.deepEqual(plan.summary.secondaryEvents, [{ date: secondary.date, name: secondary.name, priority: 'B' }]);
  assert.equal(plan.workouts.some(workout => workout.date.startsWith(secondary.date)), false);
  const near = plan.workouts.filter(workout => workout.date.startsWith('2027-02-09') || workout.date.startsWith('2027-02-11'));
  assert.ok(near.length > 0);
  assert.ok(near.every(workout => workout.structure.distribution.highSeconds === 0));
  assert.ok(plan.workouts.some(workout => workout.modality === 'natacao' && workout.structure.steps.some(step => step.label.includes('águas abertas'))));
});
