import test from 'node:test';
import assert from 'node:assert/strict';
import { Decoder, Stream } from '@garmin/fitsdk';
import { generateFallbackPlan, thresholdFrom3k } from '../lib/plan-engine';
import { buildFit, buildTcx, buildZwo, intervalsStartLocal } from '../lib/export-builders';

test('plano respeita modalidade única, agenda explícita e adaptação inicial', () => {
  const profile = { modality: 'corrida', weeklyHours: 4, currentWeeklyVol: 3, daySchedule: JSON.stringify({ seg: ['corrida'], qua: ['corrida'] }) };
  const plan = generateFallbackPlan(profile, [], ['seg', 'qua'], '2026-11-16T12:00:00Z', 4);
  assert.ok(plan.length > 0);
  assert.ok(plan.every(w => w.modality === 'corrida'));
  assert.ok(plan.every(w => [1,3].includes(new Date(w.date).getDay())));
  assert.ok(plan.filter(w => w.weekNumber === 1).every(w => w.targetZone === 'Z2'));
  assert.ok(plan.every(w => Number.isFinite(w.duration) && w.duration > 0));
});

test('plano sem natação respeita perfil e não gera sessões de piscina', () => {
  const plan = generateFallbackPlan({ canSwim: false, weeklyHours: 4, currentWeeklyVol: 3 }, [], ['seg', 'qua', 'sex'], '2026-11-16T12:00:00Z', 4);
  assert.ok(plan.length > 0);
  assert.ok(plan.every(w => w.modality !== 'natacao'));
});

test('limiar de corrida usa tempo do teste de 3 km', () => {
  assert.equal(thresholdFrom3k('14:30'), 308);
  assert.equal(thresholdFrom3k('inválido'), null);
});

for (const modality of ['corrida', 'ciclismo', 'natacao']) {
  test(`exportação FIT de ${modality} tem CRC válido e passos legíveis`, () => {
    const data = buildFit({ modality, duration: 45, title: 'Treino de teste', targetZone: 'Z2', date: '2026-11-16' });
    const decoder = new Decoder(Stream.fromByteArray(data));
    assert.equal(decoder.isFIT(), true);
    assert.equal(decoder.checkIntegrity(), true);
    const result = decoder.read();
    assert.deepEqual(result.errors, []);
    assert.ok(result.messages.workoutStepMesgs && result.messages.workoutStepMesgs.length >= 3);
  });
}

test('TCX não corta entidades XML no nome limitado a 15 caracteres', () => {
  const xml = buildTcx({ title: '12345678901234&continuação', duration: 45, modality: 'corrida' });
  assert.ok(xml.includes('<Name>12345678901234&amp;</Name>'));
});

test('ZWO escapa conteúdo e preserva modalidade e duração', () => {
  const xml = buildZwo({ title: 'Ritmo & força', description: '<treino>', duration: 60, modality: 'corrida' });
  assert.ok(xml.includes('Ritmo &amp; força'));
  assert.ok(xml.includes('&lt;treino&gt;'));
  assert.ok(xml.includes('<sportType>run</sportType>'));
  const durations = [...xml.matchAll(/Duration="(\d+)"/g)].map(match => Number(match[1]));
  assert.equal(durations.reduce((sum, value) => sum + value, 0), 3600);
});

test('Intervals preserva data e horário local sem converter fuso', () => {
  assert.equal(intervalsStartLocal({ date: '2026-11-16T00:00:00Z' }), '2026-11-16T04:30:00');
  assert.equal(intervalsStartLocal({ date: 'inválida' }), null);
});
