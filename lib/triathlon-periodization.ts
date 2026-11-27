import { TRIATHLON_FORMATS, type TriathlonFormat } from './triathlon-race';
import type { TrainingModality, TrainingPhase, TrainingProfile } from './training-types';
import type { PolarizedWindow } from './polarized-distribution';

const DAY_MS = 86_400_000;
const POST_RACE_WEEKS = 2;

export function triathlonPeriodization(format: TriathlonFormat, start: Date, race: Date) {
  const formatRule = TRIATHLON_FORMATS[format];
  const raceWeek = Math.floor((race.getTime() - start.getTime()) / (7 * DAY_MS));
  const firstTaperWeek = Math.max(0, raceWeek - formatRule.taperWeeks + 1);
  const baseWeeks = Math.min(formatRule.baseWeeks, Math.floor(firstTaperWeek / 2));
  const recoveryInterval = format === 'ironman' || format === '70.3' ? 4 : 3;
  return {
    raceWeek,
    horizon: raceWeek + 1 + POST_RACE_WEEKS,
    supportedWeeks: formatRule.defaultWeeks,
    phase(date: Date): TrainingPhase {
      const week = Math.floor((date.getTime() - start.getTime()) / (7 * DAY_MS));
      if (date > race) return 'transition';
      if (week === raceWeek) return 'race';
      if (week >= firstTaperWeek) return 'peak';
      return week < baseWeeks ? 'base' : 'build';
    },
    window(week: number): PolarizedWindow {
      if (week > raceWeek) return 'pos-prova';
      if (week >= firstTaperWeek) return 'polimento';
      return (week + 1) % recoveryInterval === 0 ? 'descarga' : 'regular';
    },
    volumeFraction(window: PolarizedWindow, week: number) {
      if (window === 'descarga') return 0.65;
      if (window === 'pos-prova') return 0.35;
      if (window === 'polimento') return Math.max(0.4, 0.6 - 0.1 * (week - firstTaperWeek));
      return 1;
    },
  };
}

const DISCIPLINE_SHARE = { natacao: 0.18, ciclismo: 0.47, corrida: 0.30, forca: 0 };

export function triathlonSportShare(profile: TrainingProfile | null, sport: TrainingModality) {
  const share = DISCIPLINE_SHARE[sport];
  if (!share) return 0;
  if (profile?.weakestSport === sport) return share * 1.1;
  if (profile?.strongestSport === sport) return share * 0.95;
  return share;
}
