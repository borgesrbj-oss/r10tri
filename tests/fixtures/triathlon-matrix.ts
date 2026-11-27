import type { TrainingProfile, TrainingRace } from '../../lib/training-types';
import type { TrainingFeedback } from '../../lib/training-feedback';

export const cycleStart = '2027-01-04';
export const observedFeedback: TrainingFeedback = {
  status: 'progredir', initialFactor: 1, highFraction: 0.2, growth: 0.05,
  reasons: ['Check-ins fictícios em três dias indicam tolerância à carga.'], observedSessions: 3,
};

const formats = {
  sprint: { goal: 'sprint', weeks: 12, distances: [750, 20_000, 5000] },
  olimpico: { goal: 'olimpica', weeks: 14, distances: [1500, 40_000, 10_000] },
  '70.3': { goal: '70.3', weeks: 16, distances: [1900, 90_000, 21_100] },
  ironman: { goal: 'ironman', weeks: 24, distances: [3800, 180_000, 42_195] },
} as const;
const levels = ['iniciante', 'intermediario', 'avancado'] as const;
type Format = keyof typeof formats;
type Level = typeof levels[number];
const weekdays = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

export interface TriathlonCase {
  profile: TrainingProfile;
  race: TrainingRace;
  days: string[];
  weeks: number;
  example: boolean;
  format: Format;
  level: Level;
}

export function triathlonMatrix(seed = 20261123): TriathlonCase[] {
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  }
  const integer = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  return (Object.keys(formats) as Format[]).flatMap(format => levels.flatMap((level, tier) =>
    Array.from({ length: 10 }, (_, index): TriathlonCase => {
      const rule = formats[format];
      const raceDay = new Date(Date.parse(cycleStart) + (7 * rule.weeks - 1) * 86400000).toISOString().slice(0, 10);
      const limit = integer(6, 15);
      const recent = integer(270 + tier * 90, 400 + tier * 120);
      const swim = Math.round(recent * (0.18 + random() * 0.04));
      const run = Math.round(recent * (0.29 + random() * 0.03));
      const missingDay = integer(0, 6);
      const days = weekdays.filter((_, position) => position !== missingDay);
      const ftp = integer(150 + 25 * tier, 215 + 30 * tier);
      const swimSec = integer(121 - 9 * tier, 155 - 10 * tier);
      const runSec = integer(365 - 31 * tier, 435 - 37 * tier);
      const speed = integer(22 + 3 * tier, 26 + 5 * tier);
      const t1 = integer(105, 260);
      const t2 = integer(95, 230);
      const pace = (seconds: number) => Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
      const [swimMeters, bikeMeters, runMeters] = rule.distances;
      const totals = {
        natacao: Math.round(swimMeters / 100 * swimSec),
        t1,
        ciclismo: Math.round(bikeMeters / 1000 / speed * 3600),
        t2,
        corrida: Math.round(runMeters / 1000 * runSec),
      };
      const ranges = Object.fromEntries(Object.entries(totals).map(([key, total]) => [
        key, { minSeconds: Math.floor(total * 0.9), maxSeconds: Math.ceil(total * 1.1) },
      ]));
      const source = 'Referência fictícia para teste automatizado';
      const race = {
        id: format + '-' + level + '-' + index, distance: format, priority: 'A', date: raceDay,
        segmentTargets: {
          format, reviewedLevel: level, rangeSource: source, ranges,
          goalSeconds: Object.values(totals).reduce((sum, value) => sum + value, 0),
          references: {
            natacao: { value: swimSec, source }, t1: { value: t1, source },
            ciclismo: { value: speed, watts: Math.round(ftp * 0.8), source },
            t2: { value: t2, source }, corrida: { value: runSec, source },
          },
        },
      };
      const profile: TrainingProfile = {
        modality: 'triatlo', trainingGoal: rule.goal, level, weeklyHours: limit, currentWeeklyVol: recent / 60,
        availableDays: days, strengthAvailable: true, hasPoolAccess: true, canSwim: true, hasPowerMeter: true,
        swimLevel: index % 4 === 0 && level === 'iniciante' ? 'basico' : 'intermediario',
        runLevel: level, bikeLevel: level, weakestSport: ['natacao', 'corrida', 'ciclismo'][index % 3],
        ftp, currentWeight: integer(52, 98), swimCssPace: pace(swimSec - 10), runThresholdPace: pace(runSec - 34),
        birthDate: '1993-08-12', sleepHours: 8,
        planningPreferences: { recentMinutes: { natacao: swim, ciclismo: recent - swim - run, corrida: run } },
      };
      return { profile, race, days, format, level, weeks: rule.weeks, example: index === 2 &&
        ((format === 'sprint' && level === 'iniciante') || (format === '70.3' && level === 'intermediario') || (format === 'ironman' && level === 'avancado')) };
    }),
  ));
}
