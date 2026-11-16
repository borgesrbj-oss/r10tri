import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import * as alerts from '../lib/coach-alerts';

const now = new Date('2026-11-16T15:00:00Z');
const day = 24 * 60 * 60 * 1000;
const root = fileURLToPath(new URL('..', import.meta.url));

function athlete(changes: Partial<alerts.CoachAlertAthlete> = {}): alerts.CoachAlertAthlete {
  return {
    id: 'atleta-temporario', name: 'Atleta temporário', createdAt: new Date(now.getTime() - 20 * day),
    profile: { birthDate: new Date('1990-01-01T12:00:00Z'), currentWeight: 70, level: 'intermediario', weeklyHours: 5, availableDays: ['seg', 'qua', 'sex'], modality: 'corrida' },
    latestLog: { completedAt: new Date(now.getTime() - day), painScore: null, fatigueScore: null, sleepHours: null },
    overdueWorkouts: 0, weeklyPlannedMinutes: 240,
    ...changes,
  };
}
function kinds(sample: alerts.CoachAlertAthlete) { return alerts.buildCoachAlerts([sample], now).athletes[0]?.alerts.map(alert => alert.kind) || []; }

test('perfil completo e registro recente sem sinais não geram alertas', () => {
  const report = alerts.buildCoachAlerts([athlete()], now);
  assert.equal(report.summary.athletesReviewed, 1);
  assert.equal(report.summary.athletesWithAlerts, 0);
  assert.equal(report.summary.totalAlerts, 0);
});

test('triagem incompleta gera lista de campos mínimos sem devolver perfil ou informações privadas', () => {
  const sample = athlete();
  const profile = { ...sample.profile!, currentWeight: null, medicalConditions: 'dado-sintetico-nao-publico', intervalsIcuApiKey: 'credencial-sintetica-nao-publica' };
  const report = alerts.buildCoachAlerts([{ ...sample, profile }], now);
  assert.ok(report.athletes[0].alerts.some(alert => alert.kind === 'assessment' && alert.detail.includes('peso atual')));
  const serialized = JSON.stringify(report);
  for (const excluded of ['medicalConditions', 'intervalsIcuApiKey', 'dado-sintetico-nao-publico', 'credencial-sintetica-nao-publica', 'currentWeight']) assert.equal(serialized.includes(excluded), false);
});

test('inatividade exige conta com pelo menos 7 dias e respeita o limite exato do último registro', () => {
  assert.ok(!kinds(athlete({ createdAt: new Date(now.getTime() - 6 * day), latestLog: null })).includes('inactive'));
  assert.ok(kinds(athlete({ createdAt: new Date(now.getTime() - 7 * day), latestLog: null })).includes('inactive'));
  assert.ok(kinds(athlete({ latestLog: { completedAt: new Date(now.getTime() - 7 * day), painScore: null, fatigueScore: null, sleepHours: null } })).includes('inactive'));
  assert.ok(!kinds(athlete({ latestLog: { completedAt: new Date(now.getTime() - 7 * day + 1), painScore: null, fatigueScore: null, sleepHours: null } })).includes('inactive'));
});

test('volume só gera revisão quando supera disponibilidade válida, e pendências são independentes', () => {
  assert.ok(!kinds(athlete({ weeklyPlannedMinutes: 300 })).includes('volume'));
  assert.ok(kinds(athlete({ weeklyPlannedMinutes: 301 })).includes('volume'));
  const sample = athlete();
  assert.ok(!kinds({ ...sample, profile: { ...sample.profile!, weeklyHours: null }, weeklyPlannedMinutes: 500 }).includes('volume'));
  assert.ok(kinds(athlete({ overdueWorkouts: 2 })).includes('overdue'));
  assert.ok(!kinds(athlete({ overdueWorkouts: 0 })).includes('overdue'));
});

test('dor, fadiga e sono do último check-in geram conversa, sem diagnóstico', () => {
  const log = { completedAt: new Date(now.getTime() - day), painScore: 0, fatigueScore: 7, sleepHours: 6 };
  assert.ok(!kinds(athlete({ latestLog: log })).includes('checkin'));
  for (const change of [{ painScore: 1 }, { fatigueScore: 8 }, { sleepHours: 5.9 }]) {
    const report = alerts.buildCoachAlerts([athlete({ latestLog: { ...log, ...change } })], now);
    assert.equal(report.summary.checkinsForReview, 1);
    assert.ok(report.athletes[0].alerts.some(alert => alert.kind === 'checkin' && alert.priority === 'review'));
  }
});

test('datas futuras ou inválidas de registros não simulam atividade recente nem check-in atual', () => {
  for (const completedAt of [new Date(now.getTime() + day), 'inválida']) {
    const sample = athlete({ latestLog: { completedAt, painScore: 4, fatigueScore: 9, sleepHours: 4 } });
    assert.ok(kinds(sample).includes('inactive'));
    assert.ok(!kinds(sample).includes('checkin'));
  }
});

test('semana e atraso respeitam dia civil de São Paulo e segunda-feira como início', () => {
  const sunday = alerts.coachAlertWindow(new Date('2026-11-16T02:00:00Z'));
  assert.equal(sunday.today.toISOString(), '2026-11-15T00:00:00.000Z');
  assert.equal(sunday.weekStart.toISOString(), '2026-11-09T00:00:00.000Z');
  const monday = alerts.coachAlertWindow(new Date('2026-11-16T03:00:00Z'));
  assert.equal(monday.weekStart.toISOString(), '2026-11-16T00:00:00.000Z');
  assert.equal(monday.weekEnd.toISOString(), '2026-11-23T00:00:00.000Z');
  assert.equal(monday.overdueSince.toISOString(), '2026-11-09T00:00:00.000Z');
  assert.throws(() => alerts.coachAlertWindow(new Date('inválida')));
});

function route(prisma: any, user: { id: string; role: string } | null) {
  const source = ts.transpileModule(fs.readFileSync(path.join(root, 'app/api/coach-alerts/route.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const sandboxModule = { exports: {} };
  const dependencies: Record<string, unknown> = {
    'next/server': { NextResponse: { json: (body: unknown, options?: ResponseInit) => Response.json(body, options) } },
    '@/auth': { auth: async () => user ? { user } : null },
    '@/lib/db': { prisma },
    '@/lib/coach-alerts': alerts,
  };
  vm.runInNewContext(source, { module: sandboxModule, exports: sandboxModule.exports, require: (name: string) => { if (!(name in dependencies)) throw new Error('Dependência inesperada'); return dependencies[name]; }, Response, Date }, { filename: 'coach-alerts/route.ts' });
  return sandboxModule.exports as { GET: () => Promise<Response> };
}

test('API nega ausência de sessão e atleta antes de consultar dados dos alertas', async () => {
  let queries = 0;
  const prisma = { user: { findMany: async () => { queries++; throw new Error('Consulta indevida'); } } };
  assert.equal((await route(prisma, null).GET()).status, 401);
  assert.equal((await route(prisma, { id: 'atleta', role: 'atleta' }).GET()).status, 403);
  assert.equal(queries, 0);
});

test('API do coach limita dados, agrega volumes e não serializa credenciais ou dados clínicos', async () => {
  const queries: any[] = [];
  const sample = athlete();
  const prisma = {
    user: {
      findMany: async (query: any) => { queries.push(query); return [{ id: sample.id, name: sample.name, createdAt: sample.createdAt, profile: { ...sample.profile, medicalConditions: 'dado-nao-publico', intervalsIcuApiKey: 'valor-nao-publico' }, workoutLogs: [sample.latestLog] }]; },
      count: async () => 150,
    },
    workout: { groupBy: async (query: any) => { queries.push(query); return query._count ? [{ userId: sample.id, _count: { _all: 2 } }] : [{ userId: sample.id, _sum: { duration: 400 } }]; } },
  };
  const response = await route(prisma, { id: 'coach', role: 'coach' }).GET();
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(queries[0].take, 100);
  assert.equal(queries[0].select.workoutLogs.take, 1);
  assert.equal(result.limited, true);
  assert.equal(result.summary.athletesReviewed, 1);
  assert.ok(result.athletes[0].alerts.some((alert: alerts.CoachAlert) => alert.kind === 'volume'));
  const serialized = JSON.stringify(result);
  for (const excluded of ['intervalsIcuApiKey', 'medicalConditions', 'valor-nao-publico', 'dado-nao-publico', 'password']) assert.equal(serialized.includes(excluded), false);
  assert.ok(queries.slice(1).every(query => query.where.OR.some((condition: any) => condition.plan?.status === 'active')));
});

test('API sem atletas retorna estado vazio sem consultar agregados de treino', async () => {
  const prisma = { user: { findMany: async () => [], count: async () => 0 } };
  const response = await route(prisma, { id: 'coach', role: 'coach' }).GET();
  assert.equal(response.status, 200);
  const report = await response.json();
  assert.equal(report.summary.athletesReviewed, 0);
  assert.equal(report.athletes.length, 0);
});
