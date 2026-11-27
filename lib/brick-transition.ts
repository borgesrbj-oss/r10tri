import type { TrainingPhase, WorkoutStructure } from './training-types';

export function buildBrickTransition(
  seconds: number,
  phase: TrainingPhase,
  kind: 'T1' | 'T2' = 'T2',
): WorkoutStructure {
  return {
    version: 1,
    modality: 'corrida',
    phase,
    transition: kind,
    durationSeconds: seconds,
    steps: [{
      kind: 'recuperacao',
      label: kind === 'T1' ? 'Transição natação → bike' : 'Transição bike → corrida',
      durationSeconds: seconds,
      zone: null,
      rest: 'passivo',
      target: {
        basis: 'rpe',
        unit: 'RPE',
        low: 0,
        high: 0,
        text: 'Troque o equipamento e prepare-se para a próxima modalidade.',
        source: 'Tempo reservado à transição do brick.',
      },
    }],
    distribution: {
      lowSeconds: 0,
      moderateSeconds: 0,
      highSeconds: 0,
      restSeconds: seconds,
      enduranceSeconds: 0,
      strengthSeconds: 0,
      totalSeconds: seconds,
      highFraction: 0,
    },
    warnings: [],
    requiresCoachReview: false,
  };
}

export function describeBrickTransition(structure: WorkoutStructure): string {
  const transition = structure.transition ?? 'T2';
  const order = transition === 'T1' ? 'natação → bike' : 'bike → corrida';
  return `${transition} · Transição ${order} · ${structure.durationSeconds} s. Reserve esse tempo para trocar o equipamento e preparar a próxima modalidade.`;
}

/** Bricks antigos usavam modalidade de descanso fora e corrida no JSON do editor. */
export function isBrickTransition(
  workout: { modality?: string; brickGroupId?: string | null; partOrder?: number | null },
  structure: WorkoutStructure,
): boolean {
  return workout.modality === 'descanso'
    && Boolean(workout.brickGroupId)
    && structure.modality === 'corrida'
    && (structure.transition != null || (structure.origin === 'coach' && workout.partOrder === 1))
    && structure.steps.length === 1
    && structure.steps.every(step => step.kind === 'recuperacao' && step.rest === 'passivo' && step.zone === null);
}
