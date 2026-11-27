import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDayInBrazil, currentTrainingWeek, sessionPurpose, weeklyTrainingOverview } from '../lib/weekly-training-overview';

test('a semana começa na segunda-feira e respeita a data do atleta em Brasília', () => {
  assert.equal(calendarDayInBrazil(new Date('2026-11-23T01:00:00Z')), '2026-11-22');
  assert.deepEqual(currentTrainingWeek('2026-11-22'), {
    start: new Date('2026-11-16T00:00:00Z'),
    end: new Date('2026-11-23T00:00:00Z'),
  });
});

test('separa natação, bike e corrida e mantém ausências distintas de zero', () => {
  const week = weeklyTrainingOverview([
    { modality: 'natacao', duration: 60, completed: true, paused: false, log: { actualDuration: 52 } },
    { modality: 'natacao', duration: 40, completed: true, paused: false, log: { actualDuration: null } },
    { modality: 'ciclismo', duration: 80, completed: false, paused: false },
    { modality: 'corrida', duration: 32, completed: true, paused: false, log: { actualDuration: 0 } },
  ]);
  assert.equal(week.minutes, 212);
  assert.equal(week.completed, 3);
  assert.equal(week.total, 4);
  assert.deepEqual(week.sports.slice(0, 3), [
    { key: 'natacao', label: 'Natação', plannedMinutes: 100, recordedMinutes: 52, missingDuration: 1 },
    { key: 'ciclismo', label: 'Ciclismo', plannedMinutes: 80, recordedMinutes: null, missingDuration: 0 },
    { key: 'corrida', label: 'Corrida', plannedMinutes: 32, recordedMinutes: 0, missingDuration: 0 },
  ]);
});

test('mantém os realizados arquivados e separa transição e descanso confirmado', () => {
  const week = weeklyTrainingOverview([
    { modality: 'corrida', duration: 30, completed: true, paused: false, plan: { status: 'archived' }, log: { actualDuration: 25 } },
    { modality: 'corrida', duration: 25, completed: false, paused: false, plan: { status: 'archived' } },
    { modality: 'ciclismo', duration: 90, completed: false, paused: true },
    { modality: 'ciclismo', duration: 42, completed: false, paused: false, plan: { status: 'active' } },
    { modality: 'descanso', duration: 0, completed: true, paused: false, log: { actualDuration: 0 } },
    { modality: 'descanso', duration: 2, completed: false, paused: false, plan: { status: 'active' } },
  ]);
  assert.equal(week.minutes, 44);
  assert.equal(week.total, 1);
  assert.equal(week.completed, 0);
  assert.equal(week.sports.find(sport => sport.key === 'corrida')?.recordedMinutes, 25);
  assert.equal(week.sports.find(sport => sport.key === 'descanso')?.plannedMinutes, 2);
  assert.equal(week.sports.find(sport => sport.key === 'descanso')?.recordedMinutes, null);
});

test('resume o objetivo explícito sem interpretar descrições legadas', () => {
  assert.equal(sessionPurpose('Objetivo desta sessão:  Praticar técnica de respiração. \nAquecimento · 10 min'), 'Praticar técnica de respiração.');
  assert.equal(sessionPurpose('Treino antigo sem descrição de objetivo.'), null);
  assert.equal(sessionPurpose(undefined), null);
});
