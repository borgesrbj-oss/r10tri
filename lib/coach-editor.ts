import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import {
  calendarDay,
  combineDistributions,
  describeStructure,
  distributionForSteps,
  readWorkoutStructure,
} from './training-structure';
import { bikeThreshold, targetForZone, effortTarget } from './training-zones';
import { reviewWeek } from './workout-reassessment';
import { weekStart } from './calendar-period';
import { trainingFeedback } from './training-feedback';
import type {
  TrainingProfile,
  TrainingStep,
  WorkoutStructure,
} from './training-types';

const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => Boolean(calendarDay(v)), 'Data inválida.');
export const blockSchema = z
  .object({
    kind: z.enum(['aquecimento', 'principal', 'recuperacao', 'desaquecimento']),
    label: z.string().trim().min(1).max(200),
    seconds: z.number().int().min(1).max(21600),
    repeat: z.number().int().min(1).max(30).default(1),
    recoverySeconds: z.number().int().min(0).max(3600).default(0),
    distanceMeters: z.number().min(1).max(300000).optional(),
    zone: z.enum(['Z1', 'Z2', 'Z3', 'Z4', 'Z5']).default('Z2'),
    passive: z.boolean().default(false),
    ftpLow: z.number().min(1).max(200).optional(),
    ftpHigh: z.number().min(1).max(200).optional(),
    notes: z.string().max(250).default(''),
  })
  .refine(
    (b) =>
      (b.ftpLow === undefined && b.ftpHigh === undefined) ||
      (b.ftpLow !== undefined &&
        b.ftpHigh !== undefined &&
        b.ftpLow <= b.ftpHigh),
    'Informe a faixa percentual completa e crescente.',
  );
export const sessionSchema = z
  .object({
    id: z.string().min(1).max(128).optional(),
    date: day,
    title: z.string().trim().min(1).max(250),
    modality: z.enum(['corrida', 'ciclismo', 'natacao', 'forca', 'brick']),
    phase: z
      .enum(['base', 'build', 'peak', 'race', 'transition'])
      .default('base'),
    notes: z.string().max(5000).default(''),
    blocks: z.array(blockSchema).min(1).max(64),
    transitionSeconds: z.number().int().min(1).max(1800).default(120),
    runBlocks: z.array(blockSchema).min(1).max(64).optional(),
  })
  .refine(
    (s) => s.modality !== 'brick' || Boolean(s.runBlocks?.length),
    'O brick exige blocos de corrida separados.',
  );
export type SessionSpec = z.infer<typeof sessionSchema>;
export type DraftChange = {
  brickGroupId?: string | null;
  partOrder?: number;
  key: string;
  id?: string;
  baseUpdatedAt?: string;
  date: string;
  title: string;
  description: string;
  modality: string;
  duration: number;
  targetZone: string | null;
  phase: string;
  structure: unknown;
  paused: boolean;
  spec?: SessionSpec;
};
export type DraftPayload = {
  baseProfileAt: string | null;
  changes: DraftChange[];
};
export function today() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function structureFor(
  blocks: SessionSpec['blocks'],
  modality: 'corrida' | 'ciclismo' | 'natacao' | 'forca',
  phase: WorkoutStructure['phase'],
  profile: TrainingProfile | null,
): WorkoutStructure {
  const steps: TrainingStep[] = [];
  for (const block of blocks)
    for (let i = 0; i < block.repeat; i++) {
      let target = block.passive
        ? effortTarget('Z1', 'Repouso passivo prescrito pelo coach.')
        : targetForZone(profile, modality, block.zone);
      if (
        !block.passive &&
        modality === 'ciclismo' &&
        block.ftpLow !== undefined
      ) {
        const ftp = bikeThreshold(profile);
        const ranges = {
          Z1: [40, 55],
          Z2: [56, 75],
          Z3: [76, 90],
          Z4: [91, 105],
          Z5: [106, 120],
        };
        const [min, max] = ranges[block.zone];
        if (block.ftpLow < min || block.ftpHigh! > max)
          throw new Error(
            'Percentual fora da zona selecionada. Separe blocos que cruzem zonas para manter a distribuição de intensidade coerente.',
          );
        if (!ftp || !(profile?.hasPowerMeter || profile?.hasTrainer))
          throw new Error(
            'Percentuais de FTP exigem FTP e equipamento compatível no perfil; use zona/PSE quando ausentes.',
          );
        target = {
          basis: 'ftp',
          unit: 'W',
          low: Math.round((ftp * block.ftpLow) / 100),
          high: Math.round((ftp * block.ftpHigh!) / 100),
          text: `${block.ftpLow}–${block.ftpHigh}% do FTP (${ftp} W)`,
          source:
            'Faixa percentual prescrita pelo coach; FTP informado pelo atleta.',
        };
      }
      steps.push({
        kind: block.kind,
        label: `${block.label}${block.repeat > 1 ? ` · ${i + 1}/${block.repeat}` : ''}${block.notes ? ` — ${block.notes}` : ''}`,
        durationSeconds: block.seconds,
        zone: block.passive ? null : block.zone,
        rest: block.passive
          ? 'passivo'
          : block.kind === 'recuperacao'
            ? 'ativo'
            : null,
        target,
        ...(block.distanceMeters
          ? { distanceMeters: block.distanceMeters }
          : {}),
      });
      if (block.recoverySeconds && i < block.repeat - 1)
        steps.push({
          kind: 'recuperacao',
          label: 'Recuperação entre repetições',
          durationSeconds: block.recoverySeconds,
          zone: 'Z1',
          rest: 'ativo',
          target: targetForZone(profile, modality, 'Z1'),
        });
    }
  const total = steps.reduce((s, b) => s + b.durationSeconds, 0);
  if (total < 60 || total > 86400 || steps.length > 400)
    throw new Error(
      'Cada parte deve ter de 1 minuto a 24 horas e até 400 passos.',
    );
  return {
    version: 1,
    origin:'coach',
    modality,
    phase,
    durationSeconds: total,
    steps,
    distribution: distributionForSteps(steps, modality),
    warnings: [
      'Prescrição manual do coach. Distâncias são auxiliares; a duração informada define o volume previsto.',
    ],
    requiresCoachReview: false,
  };
}
export function compileSession(
  spec: SessionSpec,
  profile: TrainingProfile | null,
): DraftChange[] {
  const make = (
    modality: 'corrida' | 'ciclismo' | 'natacao' | 'forca',
    blocks: SessionSpec['blocks'],
    title: string,
  ): DraftChange => {
    const structure = structureFor(blocks, modality, spec.phase, profile);
    return {
      key: randomUUID(),
      date: spec.date,
      title,
      description:
        describeStructure(structure) +
        (spec.notes ? '\n\nOrientação do coach: ' + spec.notes : ''),
      modality,
      duration: Math.ceil(structure.durationSeconds / 60),
      targetZone:
        structure.steps.find((s) => s.kind === 'principal')?.zone ?? null,
      phase: spec.phase,
      structure,
      paused: false,
      spec: { ...spec, modality, blocks, runBlocks: undefined },
    };
  };
  if (spec.modality !== 'brick')
    return [make(spec.modality, spec.blocks, spec.title)];
  const bike = make('ciclismo', spec.blocks, spec.title + ' · 1. Bike');
  const transition = make(
    'corrida',
    [
      {
        kind: 'recuperacao',
        label: 'Transição bike → corrida',
        seconds: spec.transitionSeconds,
        repeat: 1,
        recoverySeconds: 0,
        zone: 'Z1',
        passive: true,
        notes: '',
      },
    ],
    spec.title + ' · 2. Transição',
  );
  transition.modality = 'descanso';
  transition.targetZone = null;
  const run = make('corrida', spec.runBlocks!, spec.title + ' · 3. Corrida');
  const group = randomUUID();
  [bike,transition,run].forEach((part,index)=>{part.brickGroupId=group;part.partOrder=index;});
  // As partes continuam editáveis como sessões separadas; a publicação as registra juntas.
  return [bike, transition, run];
}
export function workoutToChange(workout: any): DraftChange {
  return {
    key: workout.id,
    id: workout.id,
    baseUpdatedAt: new Date(workout.updatedAt).toISOString(),
    date: new Date(workout.date).toISOString().slice(0, 10),
    title: workout.title,
    description: workout.description,
    modality: workout.modality,
    duration: workout.duration,
    targetZone: workout.targetZone,
    phase: workout.phase || 'base',
    structure: workout.structure,
    paused: workout.paused,
  };
}
export function changeData(change: DraftChange) {
  return {
    date: new Date(change.date + 'T12:00:00Z'),
    title: change.title,
    description: change.description,
    modality: change.modality,
    duration: change.duration,
    targetZone: change.targetZone,
    phase: change.phase,
    structure: JSON.parse(JSON.stringify(change.structure)),
    paused: change.paused,
    tssEstimate: null,
  };
}
export function draftPreview(
  current: any[],
  payload: DraftPayload,
  profile: TrainingProfile | null,
) {
  const touched = new Set(payload.changes.filter((c) => c.id).map((c) => c.id));
  const proposed = [
    ...current.filter((w) => !touched.has(w.id)),
    ...payload.changes.map((change) => ({ ...change, completed: false })),
  ];
  const starts = [
    ...new Set([
      ...payload.changes.map((c) => weekStart(c.date)),
      ...current
        .filter((w) => touched.has(w.id))
        .map((w) => weekStart(new Date(w.date).toISOString().slice(0, 10))),
    ]),
  ].sort();
  const metrics = (items: any[], start: string) => {
    const selected = items.filter(
      (w) =>
        !w.paused &&
        weekStart(new Date(w.date).toISOString().slice(0, 10)) === start,
    );
    const distribution = combineDistributions(
      selected
        .map((w) => readWorkoutStructure(w.structure)?.distribution)
        .filter((d) => Boolean(d)) as any,
    );
    return {
      minutes: selected.reduce((s, w) => s + w.duration, 0),
      lowSeconds: distribution.lowSeconds,
      moderateSeconds: distribution.moderateSeconds,
      highSeconds: distribution.highSeconds,
      restSeconds: distribution.restSeconds,
      strengthSeconds: distribution.strengthSeconds,
      nonLowFraction: distribution.enduranceSeconds
        ? (distribution.moderateSeconds + distribution.highSeconds) /
          distribution.enduranceSeconds
        : null,
      unknownMinutes: selected
        .filter((w) => !readWorkoutStructure(w.structure))
        .reduce((s, w) => s + w.duration, 0),
    };
  };
  const feedback=trainingFeedback(current.flatMap(w=>w.log?[w.log]:[]),current.filter(w=>!w.paused));
  return starts.map((start) => ({
    start,
    before: metrics(current, start),
    after: metrics(proposed, start),
    warnings: [...new Set([...reviewWeek(proposed, profile, start).warnings,...(['reduzir','revisar'].includes(feedback.status)?feedback.reasons:[]),...(Number(metrics(proposed,start).nonLowFraction)>.2?['Tempo moderado/alto acima da referência de 20% nesta semana. Confira o bloco, a fase e a recuperação; não ajuste intensidade apenas para fechar uma proporção.']:[])])],
  }));
}
