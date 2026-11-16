import test from 'node:test';
import assert from 'node:assert/strict';
import { formatRaceTime, parseRaceTime, predictRaceTime } from '../lib/race-prediction';

const today = new Date('2026-11-14T12:00:00Z');
const result = { modality: 'corrida', recentRaceDistanceKm: 5, recentRaceTimeSeconds: 1200, recentRaceDate: '2026-11-01', targetDistanceKm: 10 };

test('Riegel converte um resultado real de 5 km em estimativa de 10 km', () => {
  const prediction = predictRaceTime(result, today);
  assert.equal(prediction.available, true);
  if (prediction.available) {
    assert.equal(prediction.seconds, 2502);
    assert.equal(formatRaceTime(prediction.seconds), '41:42');
    assert.equal(prediction.resultAgeDays, 13);
    assert.ok(prediction.warnings.some(warning => warning.includes('não VDOT')));
  }
});

test('estimativa na mesma distância preserva o resultado de referência', () => {
  const prediction = predictRaceTime({ ...result, targetDistanceKm: 5 }, today);
  assert.equal(prediction.available && prediction.seconds, 1200);
});

test('não calcula com resultado ausente, inválido ou antigo', () => {
  for (const change of [{ recentRaceTimeSeconds: null }, { recentRaceDistanceKm: '' }, { recentRaceDate: null }, { recentRaceDate: '2026-02-30' }, { recentRaceDate: '2025-11-01' }, { recentRaceTimeSeconds: 1 }, { recentRaceDistanceKm: Infinity }, { targetDistanceKm: '' }]) {
    assert.equal(predictRaceTime({ ...result, ...change }, today).available, false);
  }
});

test('não extrapola triatlo nem aceita resultados futuros', () => {
  assert.equal(predictRaceTime({ ...result, modality: 'triatlo' }, today).available, false);
  assert.equal(predictRaceTime({ ...result, recentRaceDate: '2026-11-15' }, today).available, false);
});

test('campo de tempo aceita minutos ou horas e recusa segundos inválidos', () => {
  assert.equal(parseRaceTime('20:00'), 1200);
  assert.equal(parseRaceTime('1:40:00'), 6000);
  assert.equal(parseRaceTime('20:99'), null);
  assert.equal(parseRaceTime('1:99:00'), null);
  assert.equal(parseRaceTime('00:00'), null);
  assert.equal(parseRaceTime('20'), null);
});
