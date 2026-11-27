import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ageAt, carbohydratesForSession, criticalSwimSpeed, cyclingEnergy, cyclingLoad,
  karvonenHeartRate, maxHeartRateReference, performedWorkoutMetrics, plannedWorkoutMetrics,
  prolongedSessionFuel, runningEnergy, runningLoad, summarizedPerformedLoad, tanakaMaxHeartRate,
  trainingLoadSeries, updateTrainingLoad,
} from '../lib/triathlon-metrics';
import { bikeThreshold, cssFromTests, swimThreshold, targetForZone } from '../lib/training-zones';
import { assessmentData } from '../lib/assessment-validation';
import { buildWorkoutStructure } from '../lib/training-structure';
import { markRunningThreshold } from '../lib/training-audit';

function close(actual: number | null | undefined, reference: number) {
  assert.equal(typeof actual, 'number');
  if (reference === 0) assert.equal(actual, 0);
  else assert.ok(Math.abs(actual! - reference) / Math.abs(reference) < 0.005, `${actual} não reproduz ${reference}`);
}

test('CSS reproduz três referências de 400/200 m e recusa tempos invertidos ou iguais', () => {
  for (const [time400, time200, speed, pace] of [[420, 200, 0.90909, 110], [360, 160, 1, 100], [270, 120, 1.33333, 75]]) {
    const result = criticalSwimSpeed(time400, time200);
    close(result?.metersPerSecond, speed);
    close(result?.secondsPer100m, pace);
  }
  for (const [a, b] of [[0, 120], [180, 200], [200, 200], [Infinity, 200]]) assert.equal(criticalSwimSpeed(a, b), null);
  assert.equal(cssFromTests('06:00', '03:20'), null);
  assert.equal(swimThreshold({ testCSS400: '07:01', testCSS200: '03:20', testCSSPace: '1:50' }), 110.5);
});

test('IF e TSS usam potência normalizada, enquanto energia usa somente a média', () => {
  const cases = [
    { duration: 14400, np: 187.5, ftp: 250, average: 187.5, intensity: 0.75, tss: 225, kj: 2700, kcal: 2688.81 },
    { duration: 3600, np: 200, ftp: 200, average: 150, intensity: 1, tss: 100, kj: 540, kcal: 537.76 },
    { duration: 7200, np: 125, ftp: 250, average: 100, intensity: 0.5, tss: 50, kj: 720, kcal: 717.02 },
  ];
  for (const item of cases) {
    const load = cyclingLoad(item.duration, item.np, item.ftp);
    const energy = cyclingEnergy(item.duration, item.average);
    close(load?.intensityFactor, item.intensity);
    close(load?.tss, item.tss);
    close(energy?.mechanicalKilojoules, item.kj);
    close(energy?.approximateKilocalories, item.kcal);
  }
  assert.equal(cyclingLoad(3600, null, 200), null);
  assert.equal(cyclingLoad(3600, 200, 0), null);
  assert.equal(cyclingEnergy(3600, null), null);
  close(cyclingLoad(3600, 0, 200)?.tss, 0);
});

test('rTSS simplificado e energia em corrida reproduzem três referências de escala', () => {
  const cases = [
    { duration: 6963, distance: 21.1, threshold: 285, intensity: 0.863636, rtss: 144.263, weight: 70, kcal: 1477 },
    { duration: 3600, distance: 12, threshold: 300, intensity: 1, rtss: 100, weight: 65, kcal: 780 },
    { duration: 1200, distance: 4, threshold: 240, intensity: 0.8, rtss: 21.33333, weight: 80, kcal: 320 },
  ];
  for (const item of cases) {
    const load = runningLoad(item.duration, item.distance, item.threshold);
    close(load?.intensityFactor, item.intensity);
    close(load?.simplifiedRtss, item.rtss);
    close(runningEnergy(item.weight, item.distance), item.kcal);
  }
  assert.equal(runningLoad(3600, 12, null), null);
  assert.equal(runningEnergy(null, 12), null);
});

test('Tanaka usa idade completa e Karvonen mantém precisão até exibição', () => {
  for (const [age, resting, maximum, low, high] of [[35, 50, 183.5, 130.1, 143.45], [45, 60, 176.5, 129.9, 141.55], [60, 56, 166, 122, 133]]) {
    close(tanakaMaxHeartRate(age), maximum);
    close(karvonenHeartRate(maximum, resting, 0.6), low);
    close(karvonenHeartRate(maximum, resting, 0.7), high);
  }
  assert.equal(ageAt('1991-11-27', '2026-11-26'), 34);
  assert.equal(ageAt('1991-11-27', '2026-11-27'), 35);
  assert.equal(ageAt(new Date('2000-02-29T12:00:00.000Z'), '2026-02-29'), null);
  assert.deepEqual(maxHeartRateReference(190, 35), { bpm: 190, source: 'medida' });
  assert.deepEqual(maxHeartRateReference(null, 35), { bpm: 183.5, source: 'tanaka' });
  assert.equal(maxHeartRateReference(null, 17), null);
  assert.equal(karvonenHeartRate(160, 170, 0.6), null);
});

test('zonas batem com as faixas de potência, pace, FC de limiar e CSS', () => {
  const cases = [
    { sport: 'ciclismo', profile: { ftp: 200 }, zone: 'Z2', reference: [112, 150] },
    { sport: 'ciclismo', profile: { ftp: 250 }, zone: 'Z3', reference: [190, 225] },
    { sport: 'ciclismo', profile: { ftp: 300 }, zone: 'Z5', reference: [318, 360] },
    { sport: 'corrida', profile: { runThresholdPace: '5:00' }, zone: 'Z2', reference: [336, 375] },
    { sport: 'corrida', profile: { runThresholdPace: '4:00' }, zone: 'Z3', reference: [250, 269] },
    { sport: 'corrida', profile: { runThresholdPace: '6:00' }, zone: 'Z5', reference: [324, 346] },
    { sport: 'corrida', profile: { runStructure: 'zona', thresholdHeartRate: 170 }, zone: 'Z2', reference: [133, 147] },
    { sport: 'corrida', profile: { runStructure: 'zona', thresholdHeartRate: 160 }, zone: 'Z4', reference: [151, 159] },
    { sport: 'corrida', profile: { runStructure: 'zona', thresholdHeartRate: 180, maxHeartRate: 184 }, zone: 'Z5', reference: [180, 184] },
    { sport: 'natacao', profile: { swimCssPace: '1:50' }, zone: 'Z2', reference: [116, 122] },
    { sport: 'natacao', profile: { swimCssPace: '1:40' }, zone: 'Z3', reference: [103, 106] },
    { sport: 'natacao', profile: { swimCssPace: '2:10' }, zone: 'Z5', reference: [125, 128] },
  ] as const;
  for (const item of cases) {
    const target = targetForZone(item.profile, item.sport, item.zone);
    close(target.low, item.reference[0]);
    close(target.high, item.reference[1]);
  }
});

test('CTL, ATL e TSB conferem em três estados e o descanso real vale zero', () => {
  const first = updateTrainingLoad({ ctl: 0, atl: 0 }, 42);
  close(first?.ctl, 1);
  close(first?.atl, 6);
  close(first?.tsb, -5);
  const rest = updateTrainingLoad({ ctl: 42, atl: 28 }, 0);
  close(rest?.ctl, 41);
  close(rest?.atl, 24);
  close(rest?.tsb, 17);
  const week = trainingLoadSeries(Array.from({ length: 7 }, (_, index) => ({ date: `2027-01-0${index + 1}`, tss: 50 })));
  close(week[6].ctl, 7.761161);
  close(week[6].atl, 33.004166);
  close(week[6].tsb, -25.243005);
  const incomplete = trainingLoadSeries([{ date: '2027-01-01', tss: 50 }, { date: '2027-01-02', tss: null }, { date: '2027-01-03', tss: 50 }]);
  assert.equal(incomplete[1].ctl, null);
  assert.equal(incomplete[2].atl, null);
});

test('validação central registra a origem de estimativas e aceita taxa de carboidrato configurada', () => {
  const prepared = assessmentData({ testCSS400: '7:00', testCSS200: '3:20', testFTP20min: 200, carbohydrateRateGPerHour: 75 });
  assert.ok(prepared.ok);
  assert.equal(prepared.data.testCSSPace, '1:50');
  assert.equal(prepared.data.testFTPEstimated, 190);
  assert.equal(prepared.data.ftp, undefined);
  assert.equal(prepared.data.swimCssPace, undefined);
  assert.equal(bikeThreshold({ testFTP20min: 200, testFTPEstimated: 210 }), 190);
  assert.equal(bikeThreshold({ ftp: 250, testFTP20min: 200 }), 250);
  assert.ok(!assessmentData({ testCSS400: '6:00', testCSS200: '3:20' }).ok);
  assert.ok(!assessmentData({ carbohydrateRateGPerHour: 121 }).ok);
  assert.equal(carbohydratesForSession(7200, 75), 150);
  assert.deepEqual(prolongedSessionFuel(7200, null)?.totalGrams, [120, 180]);
  assert.equal(prolongedSessionFuel(7199, 75), null);
});

test('carga planejada e realizada ficam separadas e cobertura revela lacunas', () => {
  const profile = { runThresholdPace: '5:00', currentWeight: 70 };
  const run = buildWorkoutStructure(profile, 'corrida', 'build', 60, 600);
  markRunningThreshold(run, profile);
  assert.ok(plannedWorkoutMetrics(run, profile).tssEstimate! > 0);
  assert.equal(plannedWorkoutMetrics(buildWorkoutStructure({ ftp: 200 }, 'ciclismo', 'base', 60), null).tssEstimate, null);
  const log = { actualDuration: 60, normalizedPowerWatts: 187.5, averagePowerWatts: 150, metricThreshold: { basis: 'ftp', value: 250, source: 'referência registrada' } };
  close(performedWorkoutMetrics('ciclismo', log).tss, 56.25);
  close(performedWorkoutMetrics('ciclismo', log).mechanicalKilojoules, 540);
  assert.equal(performedWorkoutMetrics('ciclismo', { ...log, metricThreshold: undefined }).tss, undefined);
  const measured = summarizedPerformedLoad([
    { completed: true, modality: 'ciclismo', date: '2027-01-01', log: { ...log, completedAt: '2027-01-01T12:00:00Z' } },
    { completed: true, modality: 'descanso', date: '2027-01-02' },
    { completed: true, modality: 'corrida', date: '2027-01-03' },
    { completed: true, modality: 'natacao', date: '2027-01-03' },
  ], new Date('2027-01-04T12:00:00Z'));
  assert.equal(measured.days[1].tss, 0);
  assert.equal(measured.days[2].tss, null);
  assert.deepEqual(measured.coverage.corrida, { withLoad: 0, completed: 1 });
  assert.deepEqual(measured.coverage.natacao, { withLoad: 0, completed: 1 });
});
