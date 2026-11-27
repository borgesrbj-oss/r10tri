import type { WorkoutStructure } from './training-types';

const SECONDS_PER_HOUR = 3_600;
const EFFICIENCY = 0.24;
const KJ_PER_KCAL = 4.184;
const DAY_MS = 86_400_000;

function positive(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function nonNegative(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function criticalSwimSpeed(time400Seconds: number, time200Seconds: number) {
  if (!positive(time200Seconds) || !positive(time400Seconds) || time400Seconds <= time200Seconds) return null;
  const difference = time400Seconds - time200Seconds;
  const metersPerSecond = 200 / difference;
  if (!positive(metersPerSecond)) return null;
  return { metersPerSecond, secondsPer100m: difference / 2 };
}

export function cyclingLoad(durationSeconds: number, normalizedPowerWatts: number | null, ftpWatts: number | null) {
  if (!positive(durationSeconds) || !nonNegative(normalizedPowerWatts) || !positive(ftpWatts)) return null;
  const intensityFactor = normalizedPowerWatts / ftpWatts;
  return { intensityFactor, tss: (durationSeconds * normalizedPowerWatts * intensityFactor * 100) / (ftpWatts * SECONDS_PER_HOUR) };
}

export function cyclingEnergy(durationSeconds: number, averagePowerWatts: number | null) {
  if (!positive(durationSeconds) || !nonNegative(averagePowerWatts)) return null;
  const mechanicalKilojoules = (averagePowerWatts * durationSeconds) / 1_000;
  return { mechanicalKilojoules, approximateKilocalories: mechanicalKilojoules / (EFFICIENCY * KJ_PER_KCAL) };
}

export function runningLoad(durationSeconds: number, distanceKm: number, thresholdSecondsPerKm: number | null) {
  if (!positive(durationSeconds) || !nonNegative(distanceKm) || !positive(thresholdSecondsPerKm)) return null;
  const actualSpeedKmPerHour = distanceKm / (durationSeconds / SECONDS_PER_HOUR);
  const thresholdSpeedKmPerHour = SECONDS_PER_HOUR / thresholdSecondsPerKm;
  const intensityFactor = actualSpeedKmPerHour / thresholdSpeedKmPerHour;
  return { intensityFactor, simplifiedRtss: (durationSeconds / SECONDS_PER_HOUR) * intensityFactor ** 2 * 100 };
}

export function runningEnergy(weightKg: number | null | undefined, distanceKm: number) {
  return positive(weightKg) && nonNegative(distanceKm) ? weightKg * distanceKm : null;
}

export function tanakaMaxHeartRate(age: number) {
  return Number.isInteger(age) && age >= 18 && age <= 120 ? 208 - 0.7 * age : null;
}

export function ageAt(birthDate: string | Date | null | undefined, date: string | Date) {
  function civilDay(value: string | Date | null | undefined) {
    const key = value instanceof Date
      ? (Number.isFinite(value.getTime()) ? value.toISOString().slice(0, 10) : '')
      : value?.slice(0, 10) ?? '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
    const stamp = Date.parse(key + 'T00:00:00Z');
    return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === key ? key : null;
  }

  const born = civilDay(birthDate);
  const day = civilDay(date);
  if (!born || !day || born > day) return null;
  return Number(day.slice(0, 4)) - Number(born.slice(0, 4)) - Number(day.slice(5) < born.slice(5));
}

export function maxHeartRateReference(measuredBpm: number | null, age: number | null) {
  if (positive(measuredBpm)) return { bpm: measuredBpm, source: 'medida' as const };
  const estimate = age === null ? null : tanakaMaxHeartRate(age);
  return estimate === null ? null : { bpm: estimate, source: 'tanaka' as const };
}

export function karvonenHeartRate(maximumBpm: number, restingBpm: number, reserveFraction: number) {
  if (!positive(restingBpm) || !positive(maximumBpm) || restingBpm >= maximumBpm || !nonNegative(reserveFraction) || reserveFraction > 1) return null;
  return restingBpm + reserveFraction * (maximumBpm - restingBpm);
}

export function carbohydratesForSession(durationSeconds: number, gramsPerHour: number) {
  return nonNegative(durationSeconds) && nonNegative(gramsPerHour) ? gramsPerHour * durationSeconds / SECONDS_PER_HOUR : null;
}

/** Estimativa operacional para sessões contínuas longas, conforme tolerância em treino. */
export function prolongedSessionFuel(durationSeconds: number, gramsPerHour: number | null | undefined) {
  if (!positive(durationSeconds) || durationSeconds < 2 * SECONDS_PER_HOUR) return null;
  const explicit = positive(gramsPerHour) && gramsPerHour <= 120;
  const rateLow = explicit ? gramsPerHour : 60;
  const rateHigh = explicit ? gramsPerHour : 90;
  return {
    rateGramsPerHour: [rateLow, rateHigh] as const,
    totalGrams: [carbohydratesForSession(durationSeconds, rateLow)!, carbohydratesForSession(durationSeconds, rateHigh)!] as const,
    source: explicit ? 'taxa informada pelo atleta' : 'faixa de referência para sessão prolongada',
  };
}

type LoadState = { ctl: number; atl: number };
type DailyLoad = { date: string; tss: number | null };

/** O dia atual entra nas duas médias. O TSB é a diferença no fechamento do mesmo dia. */
export function updateTrainingLoad(previous: LoadState, tss: number) {
  if (!nonNegative(tss) || !nonNegative(previous.ctl) || !nonNegative(previous.atl)) return null;
  const ctl = previous.ctl + (tss - previous.ctl) / 42;
  const atl = previous.atl + (tss - previous.atl) / 7;
  return { ctl, atl, tsb: ctl - atl };
}

/** Uma lacuna após o primeiro dado conhecido impede calcular a sequência exata. */
export function trainingLoadSeries(days: DailyLoad[], initial: LoadState | null = null) {
  let previous = initial;
  let lastDate: string | null = null;
  let interrupted = false;
  return days.map(day => {
    if (lastDate && Date.parse(day.date) - Date.parse(lastDate) !== DAY_MS && previous) interrupted = true;
    lastDate = day.date;
    if (!nonNegative(day.tss)) {
      if (previous) interrupted = true;
      return { ...day, ctl: null, atl: null, tsb: null };
    }
    const state = interrupted ? null : updateTrainingLoad(previous ?? { ctl: 0, atl: 0 }, day.tss);
    previous = state;
    return { ...day, ctl: state?.ctl ?? null, atl: state?.atl ?? null, tsb: state?.tsb ?? null };
  });
}

type ThresholdBasis = 'ftp' | 'run_threshold' | 'css';
export type WorkoutMetricThreshold = { basis: ThresholdBasis; value: number; source: string };

function isMetricBasis(value: unknown): value is ThresholdBasis {
  return value === 'ftp' || value === 'run_threshold' || value === 'css';
}

export function readMetricThreshold(input: unknown): WorkoutMetricThreshold | null {
  if (!input || typeof input !== 'object') return null;
  const threshold = input as Partial<WorkoutMetricThreshold>;
  if (!isMetricBasis(threshold.basis) || !positive(threshold.value)) return null;
  return { basis: threshold.basis, value: threshold.value, source: typeof threshold.source === 'string' ? threshold.source : 'referência registrada na sessão' };
}

export function workoutMetricThreshold(structure: WorkoutStructure | null) {
  const reference = readMetricThreshold(structure?.thresholdReference);
  if (!structure || !reference) return null;
  const expected = { ciclismo: 'ftp', corrida: 'run_threshold', natacao: 'css', forca: null }[structure.modality];
  if (reference.basis !== expected) return null;
  const step = structure.steps.find(item => item.target.basis === reference.basis);
  return { ...reference, source: step?.target.source ?? reference.source };
}

type WorkoutMetricLog = {
  actualDuration?: number | null;
  actualDistance?: number | null;
  normalizedPowerWatts?: number | null;
  averagePowerWatts?: number | null;
  weight?: number | null;
  metricThreshold?: unknown;
};

export function performedWorkoutMetrics(modality: string, log: WorkoutMetricLog | null | undefined) {
  if (!log || !positive(log.actualDuration)) return {};
  const seconds = log.actualDuration * 60;
  const threshold = readMetricThreshold(log.metricThreshold);
  if (modality === 'ciclismo') {
    const load = cyclingLoad(seconds, log.normalizedPowerWatts ?? null, threshold?.basis === 'ftp' ? threshold.value : null);
    const energy = cyclingEnergy(seconds, log.averagePowerWatts ?? null);
    return { intensityFactor: load?.intensityFactor, tss: load?.tss, mechanicalKilojoules: energy?.mechanicalKilojoules, approximateKilocalories: energy?.approximateKilocalories };
  }
  if (modality === 'corrida' && positive(log.actualDistance)) {
    const load = runningLoad(seconds, log.actualDistance, threshold?.basis === 'run_threshold' ? threshold.value : null);
    return { intensityFactor: load?.intensityFactor, tss: load?.simplifiedRtss, approximateKilocalories: runningEnergy(log.weight, log.actualDistance) ?? undefined };
  }
  if (modality === 'natacao' && positive(log.actualDistance)) {
    return { secondsPer100m: seconds / (log.actualDistance * 10) };
  }
  return {};
}

type MetricProfile = { currentWeight?: number | string | null; carbohydrateRateGPerHour?: number | string | null };

/** Calcula o rTSS simplificado planejado pelos passos com pace e distingue a carga realizada. */
export function plannedWorkoutMetrics(structure: WorkoutStructure, profile: MetricProfile | null) {
  if (structure.modality === 'forca' || structure.steps.every(step => step.rest === 'passivo')) return { tssEstimate: null, approximateKilocalories: null, fuel: null };
  const fuel = prolongedSessionFuel(structure.durationSeconds, Number(profile?.carbohydrateRateGPerHour) || null);
  const threshold = readMetricThreshold(structure.thresholdReference);
  if (structure.modality !== 'corrida' || threshold?.basis !== 'run_threshold'){
    return { tssEstimate: null, approximateKilocalories: null, fuel };
  }
  let activeSeconds = 0;
  let distanceKm = 0;
  for (const step of structure.steps) {
    if (step.rest === 'passivo') continue;
    if (step.target.basis !== 'run_threshold' || !positive(step.target.low) || !positive(step.target.high)) {
      return { tssEstimate: null, approximateKilocalories: null, fuel };
    }
    activeSeconds += step.durationSeconds;
    const meanPace = (step.target.low + step.target.high) / 2;
    distanceKm += step.distanceMeters ? step.distanceMeters / 1_000 : step.durationSeconds / meanPace;
  }
  return {
    tssEstimate: runningLoad(activeSeconds, distanceKm, threshold.value)?.simplifiedRtss ?? null,
    approximateKilocalories: runningEnergy(Number(profile?.currentWeight), distanceKm),
    fuel,
  };
}

type ObservedWorkout = {
  modality: string;
  date: Date | string;
  completed: boolean;
  brickGroupId?: string | null;
  log?: (WorkoutMetricLog & { completedAt: Date | string }) | null;
};

const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
const dateKey = (value: Date | string) => localDate.format(new Date(value));

/** Série realizada de bike e corrida. Registros incompletos deixam lacunas, nunca zeros implícitos. */
export function summarizedPerformedLoad(workouts: ObservedWorkout[], asOf: Date = new Date()) {
  const today = dateKey(asOf);
  const coverage = { ciclismo: { withLoad: 0, completed: 0 }, corrida: { withLoad: 0, completed: 0 }, natacao: { withLoad: 0, completed: 0 } };
  const observed = new Map<string, { total: number; observed: number; missing: number; rest: boolean }>();
  for (const workout of workouts) {
    if (!workout.completed) continue;
    const aerobic = workout.modality === 'ciclismo' || workout.modality === 'corrida' || workout.modality === 'natacao';
    const explicitRest = workout.modality === 'descanso' && !workout.brickGroupId;
    if (!aerobic && !explicitRest) continue;
    // Datas de sessão no calendário são dias civis. completedAt representa o dia do registro.
    const day = workout.log ? dateKey(workout.log.completedAt) : new Date(workout.date).toISOString().slice(0, 10);
    if (day >= today) continue;
    if (workout.modality === 'natacao') {
      coverage.natacao.completed++;
      continue;
    }
    const entry = observed.get(day) ?? { total: 0, observed: 0, missing: 0, rest: false };
    if (workout.modality === 'ciclismo' || workout.modality === 'corrida') {
      const sport = coverage[workout.modality];
      sport.completed++;
      const value = performedWorkoutMetrics(workout.modality, workout.log).tss;
      if (value == null) entry.missing++;
      else {
        sport.withLoad++;
        entry.observed++;
        entry.total += value;
      }
    } else if (explicitRest) entry.rest = true;
    observed.set(day, entry);
  }
  const firstDay = [...observed.keys()].sort()[0] ?? null;
  if (!firstDay) return { firstDay, coverage, missingDays: 0, days: [] };
  const recorded = new Map<string, number | null>();
  for (const [day, entry] of observed) recorded.set(day, !entry.missing && (entry.observed || entry.rest) ? entry.total : null);
  const knownDays = [...recorded.values()].filter(tss => tss !== null).length;
  const windowStart = Math.max(Date.parse(firstDay), Date.parse(today) - 42 * DAY_MS);
  for (let date = windowStart; date < Date.parse(today); date += DAY_MS) {
    const key = new Date(date).toISOString().slice(0, 10);
    if (!recorded.has(key)) recorded.set(key, null);
  }
  const series = trainingLoadSeries([...recorded.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, tss]) => ({ date, tss })));
  return { firstDay, coverage, missingDays: (Date.parse(today) - Date.parse(firstDay)) / DAY_MS - knownDays, days: series.filter(day => Date.parse(day.date) >= windowStart) };
}
