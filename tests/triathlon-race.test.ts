import assert from 'node:assert/strict';
import test from 'node:test';
import {
  athleteRaceTargetsSchema, coachRaceTargetsSchema, getTriathlonFormat, getTriathlonRaceTarget,
  selectTrainingRace, TRIATHLON_FORMATS, TRIATHLON_SEGMENTS, type TriathlonFormat, type TriathlonSegment,
} from '../lib/triathlon-race';

const keys = Object.keys(TRIATHLON_SEGMENTS) as TriathlonSegment[];
const source = 'Referência fictícia para teste';
const cases = [
  { format: 'sprint', level: 'iniciante', references: [130, 160, 26, 130, 360], seconds: [975, 160, 2769, 130, 1800], expected: 5834 },
  { format: 'olimpico', level: 'intermediario', references: [120, 180, 30, 120, 330], seconds: [1800, 180, 4800, 120, 3300], expected: 10200 },
  { format: '70.3', level: 'intermediario', references: [130, 220, 32, 140, 315], seconds: [2470, 220, 10125, 140, 6647], expected: 19602 },
  { format: 'ironman', level: 'avancado', references: [115, 260, 34, 180, 345], seconds: [4370, 260, 19059, 180, 14557], expected: 38426 },
] as const;

function caseRace(item: (typeof cases)[number]) {
  return {
    id: item.format, date: '2027-05-01', name: 'Triatlo de exemplo', distance: item.format,
    segmentTargets: {
      format: item.format, reviewedLevel: item.level as string, goalSeconds: item.expected as number, rangeSource: source,
      references: Object.fromEntries(keys.map((key, i) => [key, { value: item.references[i] as number, source }])),
      ranges: Object.fromEntries(keys.map((key, i) => [key, { minSeconds: item.seconds[i] - 15, maxSeconds: item.seconds[i] + 15 }])),
    },
  };
}

const profile = { ftp: 200, swimCssPace: '01:45', runThresholdPace: '04:55' };
for (const item of cases) {
  test(`${item.format} soma cinco segmentos dentro da faixa com referência por trecho`, () => {
    const race = caseRace(item);
    const target = getTriathlonRaceTarget(race, { ...profile, level: item.level });
    assert.equal(target?.status, 'ready');
    assert.deepEqual(target.segments.map(segment => segment.key), keys);
    assert.deepEqual(target.segments.map(segment => segment.seconds), item.seconds);
    assert.equal(target.totalSeconds, item.expected);
    assert.equal(target.differenceFraction, 0);
    assert.deepEqual(target.segments.filter(segment => segment.distanceMeters != null).map(segment => segment.distanceMeters), [
      TRIATHLON_FORMATS[item.format].swimMeters, TRIATHLON_FORMATS[item.format].bikeMeters, TRIATHLON_FORMATS[item.format].runMeters,
    ]);
  });
}

test('aceita exatamente 2% de diferença e deixa meta incompatível pendente', () => {
  const item = cases[1];
  const race = caseRace(item);
  const athlete = { ...profile, level: item.level };
  race.segmentTargets.goalSeconds = 10000;
  const edge = getTriathlonRaceTarget(race, athlete);
  assert.equal(edge?.status, 'ready');
  assert.equal(edge.differenceFraction, 0.02);
  race.segmentTargets.goalSeconds = 9999;
  const failed = getTriathlonRaceTarget(race, athlete);
  assert.equal(failed?.status, 'pending');
  assert.equal(failed.subtotalSeconds, 10200);
  assert.ok(failed.issues.some(issue => issue.includes('mais de 2%')));
});

test('respeita percurso cadastrado, rejeita faixa e deixa nível alterado para revisão', () => {
  const item = cases[1];
  const initial = caseRace(item);
  const race = { ...initial, segmentTargets: { ...initial.segmentTargets, distancesMeters: { swimMeters: 1600 } } };
  const target = getTriathlonRaceTarget(race, { ...profile, level: 'avancado' });
  assert.equal(target?.status, 'pending');
  assert.equal(target.segments[0].seconds, 1920);
  assert.ok(target.issues.some(issue => issue.includes('Natação') && issue.includes('fora da faixa')));
  assert.ok(target.issues.some(issue => issue.includes('nível atual')));
});

test('referência faltante conserva o subtotal e potência acima do FTP exige revisão no 70.3', () => {
  const item = cases[2];
  const race = caseRace(item);
  delete race.segmentTargets.references.t2;
  const bike = race.segmentTargets.references.ciclismo;
  const changed = { ...race, segmentTargets: { ...race.segmentTargets, references: { ...race.segmentTargets.references, ciclismo: { ...bike, watts: 230 } } } };
  const result = getTriathlonRaceTarget(changed, { ...profile, level: item.level });
  assert.equal(result?.status, 'pending');
  assert.equal(result.subtotalSeconds, item.expected - item.seconds[3]);
  assert.ok(result.issues.some(issue => issue.includes('T2')));
  assert.ok(result.issues.some(issue => issue.includes('supera o FTP')));
});

test('seleção considera prioridade, formato, data e competição legada', () => {
  const calendar = [
    { id: 'passada', date: '2026-12-31', distance: 'Half', priority: 'A' },
    { id: 'sem-distancia', date: '2027-01-01', priority: 'A' },
    { id: 'sprint', date: '2027-02-01', distance: 'sprint', priority: 'A' },
    { id: 'corrida', date: '2027-02-01', distance: '42k', priority: 'A' },
    { id: 'meia-A', date: '2027-03-01', distance: '70.3', priority: 'A' },
    { id: 'meia-B', date: '2027-01-28', distance: 'Half', priority: 'B' },
  ];
  assert.equal(selectTrainingRace(calendar, '2027-01-01', 'triatlo', '70.3')?.id, 'meia-A');
  assert.equal(selectTrainingRace(calendar, '2027-01-01', 'triatlo', 'sprint')?.id, 'sprint');
  assert.equal(selectTrainingRace(calendar.slice(0, 2), '2027-01-01', 'triatlo', '70.3')?.id, 'sem-distancia');
  assert.equal(selectTrainingRace(calendar, '2027-05-01', 'triatlo'), null);
  assert.equal(getTriathlonFormat({ distance: 'Olímpica' }), 'olimpico' satisfies TriathlonFormat);
  assert.equal(getTriathlonRaceTarget(calendar[3], {}), undefined);
});

test('schema do atleta não permite sobrescrever confirmação e schema do coach reprova faixa invertida', () => {
  for (const field of ['ranges', 'references', 'reviewedLevel', 'confirmed', 'distancesMeters']) {
    assert.equal(athleteRaceTargetsSchema.safeParse({ goalSeconds: 10200, [field]: {} }).success, false);
  }
  assert.equal(athleteRaceTargetsSchema.safeParse({ goalSeconds: 10200 }).success, true);
  assert.equal(coachRaceTargetsSchema.safeParse({ ranges: { t1: { minSeconds: 100, maxSeconds: 99 } } }).success, false);
  assert.equal(coachRaceTargetsSchema.safeParse({ distancesMeters: { runMeters: 0 } }).success, false);
});
