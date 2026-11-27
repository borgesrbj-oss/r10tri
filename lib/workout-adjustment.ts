import { calendarDay } from './calendar-day';
import { weekStart } from './calendar-period';
import { dayKey, preferences } from './planning-preferences';
import { combineDistributions, readWorkoutStructure } from './training-structure';
import type { TrainingProfile } from './training-types';
import { numericValue } from './training-zones';

export const BRICK_ADJUSTMENT_MESSAGE = 'A edição individual está indisponível para partes de um treino combinado. Bike, transição e corrida devem ser ajustadas em conjunto.';

const DAY = 86_400_000;
const workoutDay = (date: Date | string) => new Date(date).toISOString().slice(0, 10);

export interface AdjustmentSession {
  id: string;
  date: string | Date;
  duration: number;
  modality: string;
  paused: boolean;
  targetZone: string | null;
  structure: unknown;
}

function weeklyImpact(sessions: AdjustmentSession[], start: string) {
  const week = sessions.filter((session) => weekStart(workoutDay(session.date)) === start);
  const distributions = week.map((session) => ({
    session,
    structure: readWorkoutStructure(session.structure),
  }));
  const distribution = combineDistributions(distributions.flatMap(({ structure }) => structure ? [structure.distribution] : []));
  return {
    minutes: week.reduce((total, session) => total + session.duration, 0),
    lowMinutes: distribution.lowSeconds / 60,
    moderateMinutes: distribution.moderateSeconds / 60,
    highMinutes: distribution.highSeconds / 60,
    unclassifiedMinutes: (distribution.unknownSeconds ?? 0) / 60 + distributions.reduce(
      (sum, { session, structure }) => sum + (!structure && !['descanso', 'forca'].includes(session.modality) ? session.duration : 0),
      0,
    ),
  };
}

function isDemanding(session: AdjustmentSession) {
  const structure = readWorkoutStructure(session.structure);
  return structure
    ? structure.distribution.moderateSeconds + structure.distribution.highSeconds > 0
    : ['Z3', 'Z4', 'Z5'].includes(session.targetZone ?? '');
}

export function reviewWorkoutAdjustment(
  previous: AdjustmentSession,
  proposed: AdjustmentSession,
  calendar: AdjustmentSession[],
  profile: TrainingProfile | null,
  raceDates: (Date | string)[] = [],
) {
  const previousDay = workoutDay(previous.date);
  const proposedDay = workoutDay(proposed.date);
  const changedDay = previousDay !== proposedDay;
  const beforeWeek = weekStart(previousDay);
  const afterWeek = weekStart(proposedDay);
  const other = calendar.filter((session) => session.id !== previous.id && !session.paused);
  const before = previous.paused ? other : [...other, previous];
  const after = proposed.paused ? other : [...other, proposed];
  const warnings: string[] = [];
  const conflicts: string[] = [];
  const weeks = [...new Set([beforeWeek, afterWeek])].sort().map((start) => ({
    start,
    before: weeklyImpact(before, start),
    after: weeklyImpact(after, start),
  }));
  if (proposed.paused) return { weeks, conflicts, warnings };

  const placementChanged = changedDay || previous.paused;
  const day = dayKey(proposed.date);
  const prefs = preferences(profile?.planningPreferences);
  const destination = after.filter((session) => workoutDay(session.date) === proposedDay);
  const dailyLimit = numericValue((profile?.dailyMinutes as Record<string, unknown> | null)?.[day]);
  const weeklyHours = numericValue(profile?.weeklyHours);
  const weeklyLimit = weeklyHours != null && weeklyHours > 0 ? Math.floor(weeklyHours * 60) : null;
  const previousDayMinutes = before.filter((session) => workoutDay(session.date) === proposedDay).reduce((sum, session) => sum + session.duration, 0);
  const nextDayMinutes = destination.reduce((sum, session) => sum + session.duration, 0);
  const warnOrBlock = (message: string, worsened: boolean) => (worsened ? conflicts : warnings).push(message);

  if (profile?.availableDays?.length && !profile.availableDays.includes(day)) {
    warnOrBlock('A data está fora dos seus dias disponíveis.', placementChanged);
  }
  if (prefs.preferred?.descanso?.includes(day)) {
    warnOrBlock('A data está reservada para descanso.', placementChanged);
  }
  if (raceDates.some((race) => workoutDay(race) === proposedDay)) {
    warnOrBlock('A data está reservada para uma prova cadastrada.', placementChanged);
  }
  if (dailyLimit != null && nextDayMinutes > dailyLimit) {
    warnOrBlock(`O dia ficaria com ${nextDayMinutes} minutos, acima do limite de ${dailyLimit} minutos.`, nextDayMinutes > previousDayMinutes);
  }
  if (prefs.maxSessionMinutes != null && proposed.duration > prefs.maxSessionMinutes) {
    warnOrBlock(`A sessão ultrapassa seu limite de ${prefs.maxSessionMinutes} minutos.`, placementChanged || proposed.duration > previous.duration);
  }
  if (prefs.doubleDays && destination.filter((session) => session.modality !== 'descanso').length > (prefs.doubleDays.includes(day) ? 2 : 1)) {
    warnOrBlock('O dia já tem o número máximo de sessões informado.', placementChanged);
  }
  for (const week of weeks) {
    if (weeklyLimit != null && week.after.minutes > weeklyLimit) {
      warnOrBlock(`A semana ficaria com ${week.after.minutes} minutos, acima do limite de ${weeklyLimit} minutos.`, week.after.minutes > week.before.minutes);
    }
  }

  const proposedTime = calendarDay(proposedDay)!.getTime();
  if (isDemanding(proposed) && other.some((session) =>
    isDemanding(session) && Math.abs(calendarDay(workoutDay(session.date))!.getTime() - proposedTime) < 2 * DAY,
  )) {
    warnOrBlock('Deixe pelo menos 48 horas entre sessões em Z3, Z4 ou Z5.', placementChanged || !isDemanding(previous));
  }
  return { weeks, conflicts, warnings: [...new Set(warnings)] };
}

export type WorkoutAdjustmentReview = ReturnType<typeof reviewWorkoutAdjustment>;
