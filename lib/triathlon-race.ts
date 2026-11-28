import { z } from 'zod';
import { calendarDay } from './calendar-day';
import { inferRaceGoal } from './planning-preferences';
import { formatRaceTime, parseRaceTime } from './race-prediction';
import type { TrainingProfile, TrainingRace } from './training-types';
import { bikeThreshold, runThreshold, swimThreshold } from './training-zones';

const worldTriathlon = 'https://triathlon.org/agegroup';
export const TRIATHLON_FORMATS = {
  sprint: { label: 'Sprint', swimMeters: 750, bikeMeters: 20_000, runMeters: 5_000, defaultWeeks: 12, baseWeeks: 4, taperWeeks: 2, source: worldTriathlon },
  olimpico: { label: 'Olímpico', swimMeters: 1500, bikeMeters: 40_000, runMeters: 10_000, defaultWeeks: 14, baseWeeks: 5, taperWeeks: 2, source: worldTriathlon },
  '70.3': { label: 'Half Distance / 70.3', swimMeters: 1900, bikeMeters: 90_000, runMeters: 21_100, defaultWeeks: 16, baseWeeks: 6, taperWeeks: 2, source: 'https://www.ironman.com/sites/default/files/2024-10/im_703_monterrey_athlete_guide_english_2024.pdf' },
  ironman: { label: 'Full Distance', swimMeters: 3800, bikeMeters: 180_000, runMeters: 42_195, defaultWeeks: 24, baseWeeks: 10, taperWeeks: 3, source: 'https://www.ironman.com/sites/default/files/2025-06/IMFR2025_Athlete%20guide_EN.pdf' },
} as const;

export type TriathlonFormat = keyof typeof TRIATHLON_FORMATS;
export const TRIATHLON_SEGMENTS = {
  natacao: 'Natação',
  t1: 'T1',
  ciclismo: 'Ciclismo',
  t2: 'T2',
  corrida: 'Corrida',
} as const;
export type TriathlonSegment = keyof typeof TRIATHLON_SEGMENTS;
const segmentKeys = Object.keys(TRIATHLON_SEGMENTS) as TriathlonSegment[];
export const TRIATHLON_DISTANCE_FIELDS = {
  natacao: 'swimMeters',
  ciclismo: 'bikeMeters',
  corrida: 'runMeters',
} as const;

export function getTriathlonFormat(race: { distance?: string | null } | null | undefined): TriathlonFormat | null {
  const goal = inferRaceGoal('triatlo', race?.distance);
  if (goal === 'olimpica') return 'olimpico';
  return goal === 'sprint' || goal === '70.3' || goal === 'ironman' ? goal : null;
}

export function selectTrainingRace<T extends TrainingRace>(
  races: readonly T[],
  start: string | Date,
  modality?: string | null,
  goal?: string | null,
): T | null {
  const startDay = calendarDay(start);
  if (!startDay) return null;
  const raceGoal = modality === 'triatlo' ? inferRaceGoal('triatlo', goal) : null;
  const eligible = races.flatMap(race => {
    const date = calendarDay(race.date);
    if (!date || date < startDay) return [];
    const triathlon = inferRaceGoal('triatlo', race.distance);
    const running = inferRaceGoal('corrida', race.distance);
    if (modality === 'triatlo' && (running || (triathlon && raceGoal && triathlon !== raceGoal))) return [];
    if (modality && modality !== 'triatlo' && (triathlon || (running && modality !== 'corrida'))) return [];
    if (modality === 'corrida' && goal === '42k' && running && running !== '42k') return [];
    return [{ race, date, triathlon, running }];
  }).sort((a, b) => a.date.getTime() - b.date.getTime() || (a.race.id ?? '').localeCompare(b.race.id ?? ''));
  const knownFormats = modality === 'triatlo' ? eligible.filter(item => item.triathlon !== null)
    : modality === 'corrida' && goal === '42k' ? eligible.filter(item => item.running === '42k') : [];
  const candidates = knownFormats.length ? knownFormats : eligible;
  return (candidates.find(item => item.race.priority === 'A') ?? candidates[0])?.race ?? null;
}

const seconds = z.number().int().positive().max(7 * 86400);
const source = z.string().trim().min(1).max(600);
const distanceInMeters = z.number().int().positive().max(1_000_000);
const sportsDistanceSchema = z.strictObject({
  swimMeters: distanceInMeters.optional(),
  bikeMeters: distanceInMeters.optional(),
  runMeters: distanceInMeters.optional(),
});
const segmentRange = z.strictObject({
  minSeconds: seconds.optional(),
  maxSeconds: seconds.optional(),
}).refine(value => value.minSeconds === undefined || value.maxSeconds === undefined || value.minSeconds <= value.maxSeconds, {
  message: 'O mínimo deve ser menor ou igual ao máximo.',
  path: ['maxSeconds'],
});
const paceReference = z.strictObject({ value: seconds.optional(), source: source.optional() });
const bikeReference = z.strictObject({
  value: z.number().positive().max(300).optional(),
  watts: z.number().int().positive().max(1500).optional(),
  source: source.optional(),
});
const levelSchema = z.enum(['iniciante', 'intermediario', 'avancado']);
export const athleteRaceTargetsSchema = z.strictObject({ goalSeconds: seconds.nullable() });
export const coachRaceTargetsSchema = z.strictObject({
  goalSeconds: seconds.optional(),
  distancesMeters: sportsDistanceSchema.optional(),
  rangeSource: source.optional(),
  ranges: z.strictObject({
    natacao: segmentRange.optional(),
    t1: segmentRange.optional(),
    ciclismo: segmentRange.optional(),
    t2: segmentRange.optional(),
    corrida: segmentRange.optional(),
  }).optional(),
  references: z.strictObject({
    natacao: paceReference.optional(),
    t1: paceReference.optional(),
    ciclismo: bikeReference.optional(),
    t2: paceReference.optional(),
    corrida: paceReference.optional(),
  }).optional(),
  confirmed: z.boolean().optional(),
});
export const raceTargetsSchema = coachRaceTargetsSchema.omit({ confirmed: true }).extend({
  format: z.enum(['sprint', 'olimpico', '70.3', 'ironman']),
  reviewedLevel: levelSchema.optional(),
});
export type CoachRaceTargetsInput = z.infer<typeof coachRaceTargetsSchema>;
export type RaceTargetsConfig = z.infer<typeof raceTargetsSchema>;
export function configuredRaceTargets(race: { distance?: string | null; segmentTargets?: unknown }): RaceTargetsConfig | undefined {
  const config = raceTargetsSchema.safeParse(race.segmentTargets);
  return config.success && config.data.format === getTriathlonFormat(race) ? config.data : undefined;
}

export const triathlonLevel = (level: unknown) => {
  const parsed = levelSchema.safeParse(level);
  return parsed.success ? parsed.data : undefined;
};

type RaceTargetPart = {
  key: TriathlonSegment;
  label: string;
  distanceMeters: number | null;
  seconds: number | null;
  range: { minSeconds: number; maxSeconds: number } | null;
  reference: string | null;
  intensityTarget: string | null;
};
type RaceTargetDetails = {
  format: TriathlonFormat;
  raceId?: string;
  raceName?: string | null;
  goalSeconds: number | null;
  segments: RaceTargetPart[];
  rangeSource: string | null;
  issues: string[];
};
export type TriathlonRaceTarget = RaceTargetDetails & (
  | { status: 'ready'; totalSeconds: number; differenceFraction: number }
  | { status: 'pending'; subtotalSeconds: number }
);

export function getTriathlonRaceTarget(
  race: TrainingRace | null | undefined,
  profile?: TrainingProfile | null,
): TriathlonRaceTarget | undefined {
  const format = getTriathlonFormat(race);
  if (!format || !race) return undefined;
  const defaults = TRIATHLON_FORMATS[format];
  const config = configuredRaceTargets(race);
  const level = triathlonLevel(profile?.level);
  const needsSubThreshold = level === 'iniciante' || format === '70.3' || format === 'ironman';
  const goalSeconds = config?.goalSeconds ?? (profile?.goalTime ? parseRaceTime(profile.goalTime) : null);
  const issues: string[] = [];
  if (config?.rangeSource == null) issues.push('Informe a fonte das faixas de tempo no cadastro da prova.');
  if (!goalSeconds) issues.push('Informe a meta de tempo total da prova.');
  if (!level || config?.reviewedLevel !== level) issues.push('O coach precisa conferir as referências de prova para o nível atual do atleta.');

  const segments = segmentKeys.map((key): RaceTargetPart => {
    const label = TRIATHLON_SEGMENTS[key];
    const distanceField = key === 'natacao' || key === 'ciclismo' || key === 'corrida' ? TRIATHLON_DISTANCE_FIELDS[key] : null;
    const distanceMeters = distanceField ? config?.distancesMeters?.[distanceField] ?? defaults[distanceField] : null;
    const band = config?.ranges?.[key];
    const range = band?.minSeconds !== undefined && band?.maxSeconds !== undefined
      ? { minSeconds: band.minSeconds, maxSeconds: band.maxSeconds } : null;
    const reference = config?.references?.[key];
    const value = reference?.value;
    const part: RaceTargetPart = { key, label, distanceMeters, seconds: null, range, reference: reference?.source ?? null, intensityTarget: null };
    if (!range) issues.push(`${label}: informe a faixa de tempo.`);
    if (!value || !reference?.source) {
      issues.push(`${label}: informe um desempenho comparável e sua fonte.`);
      return part;
    }
    if (key === 'natacao') {
      part.seconds = Math.round(distanceMeters! / 100 * value);
      part.intensityTarget = `${formatRaceTime(value)}/100 m`;
      const css = swimThreshold(profile ?? null);
      if (needsSubThreshold && css && value < css) issues.push('Natação: o ritmo-alvo é mais rápido que o CSS informado para este nível ou formato.');
    } else if (key === 'ciclismo') {
      part.seconds = Math.round(distanceMeters! / 1000 / value * 3600);
      const watts = config?.references?.ciclismo?.watts;
      part.intensityTarget = watts ? `${value} km/h · ${watts} W` : `${value} km/h em percurso comparável`;
      const ftp = bikeThreshold(profile ?? null);
      if (needsSubThreshold && watts && ftp && watts > ftp) issues.push('Ciclismo: a potência-alvo supera o FTP informado para este nível ou formato.');
    } else if (key === 'corrida') {
      part.seconds = Math.round(distanceMeters! / 1000 * value);
      part.intensityTarget = `${formatRaceTime(value)}/km após o pedal`;
      const threshold = runThreshold(profile ?? null);
      if (needsSubThreshold && threshold && value < threshold) issues.push('Corrida: o ritmo-alvo é mais rápido que o limiar informado para este nível ou formato.');
    } else {
      part.seconds = value;
    }
    if (range && (part.seconds < range.minSeconds || part.seconds > range.maxSeconds)) {
      issues.push(`${label}: o tempo calculado está fora da faixa informada.`);
    }
    return part;
  });
  const subtotalSeconds = segments.reduce((total, segment) => total + (segment.seconds ?? 0), 0);
  const complete = segments.every(segment => segment.seconds != null);
  const differenceFraction = complete && goalSeconds ? Math.abs(subtotalSeconds - goalSeconds) / goalSeconds : null;
  if (differenceFraction != null && differenceFraction > 0.02) issues.push('A soma dos cinco segmentos difere mais de 2% da meta informada.');
  const details: RaceTargetDetails = { format, raceId: race.id, raceName: race.name, goalSeconds, segments, rangeSource: config?.rangeSource ?? null, issues };
  if (issues.length || differenceFraction === null) return { ...details, status: 'pending', subtotalSeconds };
  return { ...details, status: 'ready', totalSeconds: subtotalSeconds, differenceFraction };
}
