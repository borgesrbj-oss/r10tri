import type { TrainingDistribution } from './training-types';

export type PolarizedWindow = 'regular' | 'descarga' | 'polimento' | 'pos-prova' | 'ciclo';

export interface PolarizedAudit {
  window: PolarizedWindow;
  activeSeconds: number;
  lowFraction: number | null;
  moderateFraction: number | null;
  highFraction: number | null;
  status: 'na_faixa' | 'fora_da_faixa' | 'indeterminado' | 'fora_do_ciclo';
}

export const REGULAR_POLARIZED_TARGET = { lowMin: 0.75, lowMax: 0.85, highMin: 0.15, highMax: 0.25, moderateMaxExclusive: 0.1 };
export const REDUCED_HIGH_MAX = 0.1;

export function auditPolarizedDistribution(distribution: TrainingDistribution, window: PolarizedWindow): PolarizedAudit {
  const unknownSeconds = distribution.unknownSeconds ?? 0;
  const activeSeconds = distribution.enduranceSeconds + unknownSeconds;
  const ratio = (seconds: number) => activeSeconds ? seconds / activeSeconds : null;
  const lowFraction = ratio(distribution.lowSeconds);
  const moderateFraction = ratio(distribution.moderateSeconds);
  const highFraction = ratio(distribution.highSeconds);
  const result = { window, activeSeconds, lowFraction, moderateFraction, highFraction };

  if (window === 'pos-prova') return { ...result, status: 'fora_do_ciclo' };
  if (lowFraction === null || moderateFraction === null || highFraction === null || unknownSeconds > 0) {
    return { ...result, status: 'indeterminado' };
  }

  const limits = REGULAR_POLARIZED_TARGET;
  const regular = window === 'regular' || window === 'ciclo';
  const inRange = moderateFraction < limits.moderateMaxExclusive && (regular
    ? lowFraction >= limits.lowMin && lowFraction <= limits.lowMax && highFraction >= limits.highMin && highFraction <= limits.highMax
    : highFraction <= REDUCED_HIGH_MAX && (window !== 'polimento' || highFraction > 0));
  return { ...result, status: inRange ? 'na_faixa' : 'fora_da_faixa' };
}
