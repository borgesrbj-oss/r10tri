import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { NextResponse } from 'next/server';
import { Decoder, Stream } from '@garmin/fitsdk';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import * as builders from '../lib/export-builders';
import * as zones from '../lib/training-zones';
import { buildWorkoutStructure, distributionForSteps, readWorkoutStructure } from '../lib/training-structure';
import type { TrainingModality, TrainingProfile, TrainingStep, TrainingZone, WorkoutStructure } from '../lib/training-types';

const profile: TrainingProfile = { ftp: 250, runThresholdPace: '5:00', swimCssPace: '1:45', hasPowerMeter: true };

function workout(modality: TrainingModality, calibration: TrainingProfile = profile) {
  const specs: [TrainingStep['kind'], number, TrainingZone][] = [
    ['aquecimento', 600, 'Z1'], ['principal', 180, 'Z4'], ['recuperacao', 120, 'Z1'],
    ['principal', 180, 'Z5'], ['desaquecimento', 300, 'Z1'],
  ];
  const steps = specs.map(([kind, durationSeconds, zone], index): TrainingStep => {
    const target = zones.targetForZone(calibration, modality, zone);
    const meters = target.unit === 's/km' ? 1000 : target.unit === 's/100m' ? 100 : null;
    return {
      kind, durationSeconds, zone, label: `Etapa ${index + 1} & "controle" <leve>`,
      rest: kind === 'recuperacao' ? 'ativo' : null, target,
      ...(meters ? { distanceMeters: Math.round(durationSeconds / ((target.low + target.high) / 2) * meters / 10) * 10 } : {}),
    };
  });
  const structure: WorkoutStructure = {
    version: 1, modality, phase: 'build', durationSeconds: 1380, steps,
    distribution: distributionForSteps(steps, modality), warnings: ['Revisar carga & disponibilidade.'], requiresCoachReview: false,
  };
  return { id: 'treino-a', userId: 'atleta-a', title: 'Intervalos & técnica <controle>', date: '2026-11-16', modality,
    duration: 999, description: 'Descrição antiga que não representa os intervalos.', targetZone: 'Z2', structure };
}

function decode(data: Buffer, raw = false) {
  const decoder = new Decoder(Stream.fromByteArray(data));
  assert.equal(decoder.isFIT(), true);
  assert.equal(decoder.checkIntegrity(), true);
  const result = decoder.read(raw ? { applyScaleAndOffset: false, expandSubFields: false, mergeHeartRates: false } : {});
  assert.deepEqual(result.errors, []);
  assert.ok(result.messages.workoutStepMesgs);
  assert.ok(result.messages.workoutMesgs);
  return { ...result.messages, workoutStepMesgs: result.messages.workoutStepMesgs, workoutMesgs: result.messages.workoutMesgs };
}

for (const modality of ['corrida', 'ciclismo', 'natacao', 'forca'] as const) {
  test(`FIT estruturado de ${modality} preserva os cinco passos, durações e alvos`, () => {
    const item = workout(modality);
    const data = builders.buildFit(item);
    const raw = decode(data, true);
    const interpreted = decode(data);
    const steps = raw.workoutStepMesgs;
    assert.equal(raw.workoutMesgs[0].numValidSteps, item.structure.steps.length);
    assert.equal(steps.length, item.structure.steps.length);
    assert.equal(steps.reduce((sum: number, step: any) => sum + step.durationValue, 0), 1380 * 1000);
    for (let index = 0; index < steps.length; index++) {
      const original = item.structure.steps[index];
      const step = steps[index];
      assert.equal(step.messageIndex, index);
      assert.equal(step.durationValue, original.durationSeconds * 1000);
      assert.equal(interpreted.workoutStepMesgs[index].durationTime, original.durationSeconds);
      assert.ok(step.notes);
      assert.ok(step.notes.includes(String(original.zone)));
      if (modality === 'ciclismo') {
        assert.equal(step.targetType, 'power');
        assert.equal(step.targetValue, 0);
        assert.equal(step.customTargetValueLow, 1000 + original.target.low);
        assert.equal(step.customTargetValueHigh, 1000 + original.target.high);
      } else if (modality === 'corrida' || modality === 'natacao') {
        const meters = modality === 'corrida' ? 1000 : 100;
        assert.equal(step.targetType, 'speed');
        assert.equal(step.targetValue, 0);
        assert.equal(step.customTargetValueLow, Math.round(meters / original.target.high * 1000));
        assert.equal(step.customTargetValueHigh, Math.round(meters / original.target.low * 1000));
      } else {
        assert.equal(step.targetType, 'open');
        assert.equal(step.customTargetValueLow, undefined);
        assert.ok(step.notes.includes(original.target.text));
      }
    }
    assert.equal(steps[0].intensity, 'warmup');
    assert.equal(steps[2].intensity, 'recovery');
    assert.equal(steps.at(-1)?.intensity, 'cooldown');
  });
}

test('FIT em km muda somente os principais de corrida com estimativa baseada no pace', () => {
  const item = workout('corrida');
  const steps = decode(builders.buildFit(item, { mode: 'km' }), true).workoutStepMesgs;
  item.structure.steps.forEach((original, index) => {
    const step = steps[index];
    if (original.kind === 'principal') {
      assert.equal(step.durationType, 'distance');
      assert.equal(step.durationValue, original.distanceMeters! * 100);
      assert.ok(step.notes);
      assert.ok(step.notes.includes('DISTÂNCIA ESTIMADA'));
      assert.ok(step.notes.includes(`${original.durationSeconds} s`));
    } else {
      assert.equal(step.durationType, 'time');
      assert.equal(step.durationValue, original.durationSeconds * 1000);
    }
  });
  const withoutThreshold = workout('corrida', {});
  for (const step of decode(builders.buildFit(withoutThreshold, { mode: 'km', thresholdPaceSec: 300 }), true).workoutStepMesgs) {
    assert.equal(step.durationType, 'time');
    assert.equal(step.targetType, 'open');
  }
  for (const step of decode(builders.buildFit(workout('ciclismo'), { mode: 'km' }), true).workoutStepMesgs) assert.equal(step.durationType, 'time');
});

test('repouso passivo usa alvo aberto e não vira trabalho aeróbico no TXT', () => {
  const item = workout('natacao');
  item.structure.steps[2] = { ...item.structure.steps[2], rest: 'passivo', zone: null, target: { ...zones.effortTarget('Z1'), low: 0, high: 0, text: 'Repouso passivo.' } };
  item.structure.distribution.highSeconds = 99999;
  const step = decode(builders.buildFit(item), true).workoutStepMesgs[2];
  assert.equal(step.intensity, 'rest');
  assert.equal(step.targetType, 'open');
  const txt = builders.buildTxt(item);
  assert.ok(txt.includes('Tempo aeróbico ativo: 21 min'));
  assert.ok(txt.includes('Z4–Z5 6 min'));
  assert.ok(txt.includes('repouso'));
  assert.ok(!txt.includes('99999'));
});

test('FIT e TCX preservam FC absoluta informada sem confundir bpm com percentual', () => {
  const item = workout('corrida');
  item.structure.steps[1].target = { basis: 'threshold_hr', unit: 'bpm', low: 150, high: 162, text: '150–162 bpm', source: 'FC de limiar informada.' };
  const raw = decode(builders.buildFit(item), true).workoutStepMesgs[1];
  assert.equal(raw.targetType, 'heartRate');
  assert.equal(raw.targetValue, 0);
  assert.equal(raw.customTargetValueLow, 250);
  assert.equal(raw.customTargetValueHigh, 262);
  const xml = builders.buildTcx(item);
  assert.equal(XMLValidator.validate(xml), true);
  const target = parser.parse(xml).TrainingCenterDatabase.Workouts.Workout.Step[1].Target;
  assert.equal(target['@_xsi:type'], 'HeartRate_t');
  assert.equal(target.HeartRateZone.Low.Value, 150);
  assert.equal(target.HeartRateZone.High.Value, 162);
});

const parser = new XMLParser({ ignoreAttributes: false });

function expandTcxSteps(nodes: any): any[] {
  return (Array.isArray(nodes) ? nodes : [nodes]).flatMap(node => node['@_xsi:type'] === 'Repeat_t'
    ? Array.from({ length: Number(node.Repetitions) }, () => expandTcxSteps(node.Child)).flat() : [node]);
}

test('TCX agrupa repetições de natação sem perder passos, pausas ou duração total', () => {
  const item = workout('natacao');
  item.structure = buildWorkoutStructure(profile, 'natacao', 'build', 60, 1800, 'Z4');
  assert.ok(item.structure.steps.length > 20);
  const xml = builders.buildTcx(item);
  assert.equal(XMLValidator.validate(xml), true);
  const parsed = parser.parse(xml).TrainingCenterDatabase.Workouts.Workout;
  assert.ok(xml.includes('xsi:type="Repeat_t"'));
  const identifiers = [...xml.matchAll(/<StepId>(\d+)<\/StepId>/g)].map(match => Number(match[1]));
  assert.equal(new Set(identifiers).size, identifiers.length);
  assert.ok(identifiers.length <= 20 && identifiers.every(id => id <= 20));
  const expanded = expandTcxSteps(parsed.Step);
  assert.equal(expanded.length, item.structure.steps.length);
  assert.deepEqual(expanded.map(step => step.Duration.Seconds), item.structure.steps.map(step => step.durationSeconds));
  assert.deepEqual(expanded.map(step => step.Intensity), item.structure.steps.map(step => step.rest === 'passivo' ? 'Resting' : 'Active'));
  assert.equal(expanded.reduce((total, step) => total + step.Duration.Seconds, 0), item.structure.durationSeconds);
});

test('TCX nunca trunca um treino longo sem repetições equivalentes e orienta usar FIT', async () => {
  const item = workout('corrida');
  item.structure.steps = [item.structure.steps[0], ...Array.from({ length: 20 }, (_, index) => ({ ...item.structure.steps[1], label: `Bloco individual ${index}`, durationSeconds: 120 + index })), item.structure.steps[4]];
  item.structure.durationSeconds = item.structure.steps.reduce((total, step) => total + step.durationSeconds, 0);
  assert.throws(() => builders.buildTcx(item), /20.*FIT/);
  const response = await endpoint(item).get('id=x&format=tcx');
  assert.equal(response.status, 422);
  assert.ok((await response.json()).error.includes('FIT ou TXT'));
  assert.equal(decode(builders.buildFit(item)).workoutStepMesgs.length, item.structure.steps.length);
});

test('TCX representa 400 passos repetidos sem exceder 99 repetições nem 20 identificadores', () => {
  const item = workout('corrida');
  const pair = [item.structure.steps[1], item.structure.steps[2]].map(step => ({ ...step, durationSeconds: 20, distanceMeters: undefined }));
  item.structure.steps = [item.structure.steps[0], ...Array.from({ length: 199 }, () => pair).flat(), item.structure.steps[4]];
  item.structure.durationSeconds = item.structure.steps.reduce((total, step) => total + step.durationSeconds, 0);
  const xml = builders.buildTcx(item);
  assert.equal(XMLValidator.validate(xml), true);
  const identifiers = [...xml.matchAll(/<StepId>(\d+)<\/StepId>/g)].map(match => Number(match[1]));
  assert.ok(identifiers.length <= 20 && identifiers.every(id => id <= 20));
  for (const match of xml.matchAll(/<Repetitions>(\d+)<\/Repetitions>/g)) assert.ok(Number(match[1]) >= 2 && Number(match[1]) <= 99);
  const expanded = expandTcxSteps(parser.parse(xml).TrainingCenterDatabase.Workouts.Workout.Step);
  assert.equal(expanded.length, 400);
  assert.deepEqual(expanded.map(step => step.Duration.Seconds), item.structure.steps.map(step => step.durationSeconds));
});

for (const modality of ['corrida', 'ciclismo', 'natacao', 'forca'] as const) {
  test(`TCX de ${modality} mantém passos e notas em XML válido`, () => {
    const item = workout(modality);
    const xml = builders.buildTcx(item);
    assert.equal(XMLValidator.validate(xml), true);
    const parsed = parser.parse(xml).TrainingCenterDatabase.Workouts.Workout;
    assert.equal(parsed.Step.length, item.structure.steps.length);
    assert.deepEqual(parsed.Step.map((step: any) => step.Duration.Seconds), item.structure.steps.map(step => step.durationSeconds));
    assert.ok(Array.from(parsed.Name).length <= 15);
    assert.ok(parsed.Step.every((step: any) => Array.from(step.Name).length <= 15));
    assert.ok(parsed.Notes.includes(item.structure.steps[1].label));
    assert.ok(parsed.Notes.includes(item.structure.steps[1].target.text));
    assert.ok(!parsed.Notes.includes(item.description));
    if (modality === 'corrida' || modality === 'natacao') {
      assert.equal(parsed.Step[1].Target['@_xsi:type'], 'Speed_t');
      assert.ok(parsed.Step[1].Target.SpeedZone.LowInMetersPerSecond < parsed.Step[1].Target.SpeedZone.HighInMetersPerSecond);
    } else assert.equal(parsed.Step[1].Target['@_xsi:type'], 'None_t');
  });
}

test('ZWO usa todos os passos com fração do FTP e instruções completas', () => {
  const item = workout('ciclismo');
  const xml = builders.buildZwo(item, { ftp: 250 });
  assert.equal(XMLValidator.validate(xml), true);
  const parsed = parser.parse(xml).workout_file;
  const steps = parsed.workout.SteadyState;
  assert.equal(steps.length, item.structure.steps.length);
  item.structure.steps.forEach((step, index) => {
    assert.equal(Number(steps[index]['@_Duration']), step.durationSeconds);
    assert.ok(Math.abs(Number(steps[index]['@_Power']) * 250 - (step.target.low + step.target.high) / 2) < 0.001);
    assert.ok(steps[index].textevent['@_message'].includes(step.target.text));
  });
});

test('ZWO sem FTP, com RPE ou de corrida preserva tempo e instruções sem potência fictícia', () => {
  for (const item of [workout('ciclismo'), workout('ciclismo', {}), workout('corrida')]) {
    const xml = builders.buildZwo(item);
    assert.equal(XMLValidator.validate(xml), true);
    const parsed = parser.parse(xml).workout_file;
    assert.equal(parsed.workout.FreeRide.length, item.structure.steps.length);
    assert.ok(!/\bPower(?:Low|High)?=/.test(xml));
    assert.equal(parsed.workout.FreeRide.reduce((sum: number, step: any) => sum + Number(step['@_Duration']), 0), 1380);
    assert.ok(parsed.description.includes(item.structure.steps[1].target.text));
  }
  assert.throws(() => builders.buildZwo(workout('natacao')), /ZWO/);
});

test('TXT usa a duração real, cada intervalo, alerta e somatórios recalculados', () => {
  const item = workout('corrida');
  item.structure.requiresCoachReview = true;
  item.description += '\nAmbiente informado: esteira. Ajuste a inclinação com o treinador.';
  const text = builders.buildTxt(item);
  assert.ok(text.includes('1380 s (23 min)'));
  assert.ok(text.includes('REVISÃO DO TREINADOR NECESSÁRIA'));
  assert.ok(text.includes(item.structure.warnings[0]));
  for (const step of item.structure.steps) { assert.ok(text.includes(step.label)); assert.ok(text.includes(step.target.text)); }
  assert.ok(text.includes('Ambiente informado: esteira.'));
  assert.ok(!text.includes('Descrição antiga que não representa os intervalos.'));
});

test('estrutura persistida inválida ou com modalidade divergente não vira treino genérico', () => {
  for (const build of [builders.buildFit, builders.buildTcx, builders.buildZwo, builders.buildTxt]) {
    assert.throws(() => build({ ...workout('corrida'), structure: { version: 99 } }), /Estrutura/);
    assert.throws(() => build({ ...workout('corrida'), modality: 'ciclismo' }), /Estrutura/);
  }
});

function endpoint(item: any, user: { id: string; role: string } | null = { id: 'atleta-a', role: 'atleta' }) {
  let reads = 0;
  const source = ts.transpileModule(fs.readFileSync(path.resolve('app/api/workouts/export/route.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const sandboxModule = { exports: {} as any };
  const dependencies: Record<string, unknown> = {
    'next/server': { NextResponse }, '@/auth': { auth: async () => user ? { user } : null },
    '@/lib/db': { prisma: { workout: { findUnique: async () => { reads++; return item; } }, athleteProfile: { findUnique: async () => profile } } },
    '@/lib/export-builders': builders, '@/lib/training-zones': zones,
  };
  vm.runInNewContext(source, { module: sandboxModule, exports: sandboxModule.exports, require: (name: string) => {
    if (!(name in dependencies)) throw new Error(`Dependência não simulada: ${name}`);
    return dependencies[name];
  }, Uint8Array }, { filename: 'app/api/workouts/export/route.ts' });
  return { get: (query = 'id=treino-a&format=txt') => sandboxModule.exports.GET({ nextUrl: new URL(`https://app.exemplo/api/workouts/export?${query}`) }), reads: () => reads };
}

test('rota individual permite proprietário e coach nos quatro formatos com anexos seguros', async () => {
  for (const user of [{ id: 'atleta-a', role: 'atleta' }, { id: 'coach', role: 'coach' }]) {
    for (const format of ['fit', 'tcx', 'zwo', 'txt']) {
      const item = { ...workout('ciclismo'), title: '\r\n"../../ técnica & controle' };
      const response = await endpoint(item, user).get(`id=treino-a&format=${format}`);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Cache-Control'), 'no-store');
      assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
      assert.match(response.headers.get('Content-Disposition'), new RegExp(`^attachment; filename="[a-z0-9_-]+\\.${format}"$`));
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.ok(bytes.length > 0);
      if (format === 'fit') assert.equal(decode(bytes).workoutStepMesgs.length, 5);
    }
  }
});

test('rota individual exige sessão, valida parâmetros e bloqueia acesso alheio', async () => {
  const anonymous = endpoint(workout('corrida'), null);
  assert.equal((await anonymous.get()).status, 401);
  assert.equal(anonymous.reads(), 0);
  const owner = endpoint(workout('corrida'));
  for (const query of ['', 'id=x&format=exe', 'id=x&format=constructor', 'id=x&mode=livre']) assert.equal((await owner.get(query)).status, 400);
  assert.equal(owner.reads(), 0);
  assert.equal((await endpoint(workout('corrida'), { id: 'outro', role: 'atleta' }).get()).status, 403);
  assert.equal((await endpoint(null).get()).status, 404);
  assert.equal((await endpoint({ ...workout('corrida'), structure: { version: 99 } }).get()).status, 422);
  assert.equal((await endpoint(workout('natacao')).get('id=x&format=zwo')).status, 422);
});

test('envio ao Intervals conserva descrição e tempo estruturados e rejeita estrutura inválida', async () => {
  for (const invalid of [false, true]) {
    const item = workout('corrida');
    item.description += '\nAmbiente informado: rua. Considere terreno e clima.';
    if (invalid) item.structure.version = 99 as 1;
    const sent: any[] = [];
    const source = ts.transpileModule(fs.readFileSync(path.resolve('app/api/plan/push-intervals/route.ts'), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const sandboxModule = { exports: {} as any };
    const dependencies: Record<string, unknown> = {
      'next/server': { NextResponse }, '@/auth': { auth: async () => ({ user: { id: item.userId, role: 'atleta' } }) },
      '@/lib/db': { prisma: {
        trainingPlan: { findUnique: async () => ({ id: 'plano-a', userId: item.userId }) },
        athleteProfile: { findUnique: async () => ({ intervalsIcuApiKey: 'credencial-de-teste' }) },
        workout: { findMany: async () => [item] },
      } },
      '@/lib/export-builders': builders, '@/lib/training-structure': { readWorkoutStructure },
    };
    vm.runInNewContext(source, { module: sandboxModule, exports: sandboxModule.exports, Buffer, require: (name: string) => {
      if (!(name in dependencies)) throw new Error(`Dependência não simulada: ${name}`);
      return dependencies[name];
    }, fetch: async (_url: string, options: RequestInit) => { sent.push(...JSON.parse(String(options.body))); return Response.json({ ok: true }); } });
    const response = await sandboxModule.exports.POST({ json: async () => ({ planId: 'plano-a' }) });
    assert.equal(response.status, invalid ? 422 : 200);
    assert.equal(sent.length, invalid ? 0 : 1);
    if (!invalid) {
      assert.equal(sent[0].moving_time, 1380);
      assert.ok(sent[0].description.includes(item.structure.steps[1].label));
      assert.ok(sent[0].description.includes(item.structure.steps[1].target.text));
      assert.ok(sent[0].description.includes('Ambiente informado: rua.'));
      assert.ok(!sent[0].description.includes('Descrição antiga que não representa os intervalos.'));
    }
  }
});
