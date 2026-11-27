import { weekStart } from './calendar-period';

export const weeklyTrainingSports = [
  { key: 'natacao', label: 'Natação' },
  { key: 'ciclismo', label: 'Ciclismo' },
  { key: 'corrida', label: 'Corrida' },
  { key: 'forca', label: 'Força' },
  { key: 'descanso', label: 'Transição' },
] as const;

export const visibleCalendarWorkouts = {
  OR: [{ planId: null }, { plan: { status: 'active' } }, { completed: true }],
};

type OverviewSport = typeof weeklyTrainingSports[number]['key'];

type OverviewWorkout = {
  modality: string;
  duration: number;
  completed: boolean;
  paused: boolean;
  plan?: { status: string } | null;
  log?: { actualDuration?: number | null } | null;
};

export function calendarDayInBrazil(now: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function currentTrainingWeek(day: string) {
  const start = new Date(weekStart(day) + 'T00:00:00Z');
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start, end };
}

/** A semana é a data agendada. Lançar um registro atrasado não desloca o treino. */
export function weeklyTrainingOverview(workouts: OverviewWorkout[]) {
  const bySport = new Map(weeklyTrainingSports.map(({ key, label }) => [key, {
    key, label, plannedMinutes: 0, recordedMinutes: null as number | null, missingDuration: 0,
  }]));
  let total = 0;
  let completed = 0;
  for (const workout of workouts) {
    const sport = bySport.get(workout.modality as OverviewSport);
    if (!sport || (workout.modality === 'descanso' && workout.duration === 0)) continue;
    if (!workout.paused && (workout.plan == null || workout.plan.status === 'active')) {
      sport.plannedMinutes += workout.duration;
      if (workout.modality !== 'descanso') {
        total++;
        if (workout.completed) completed++;
      }
    }
    if (workout.completed) {
      const value = workout.log?.actualDuration;
      if (value != null && Number.isFinite(value) && value >= 0) sport.recordedMinutes = (sport.recordedMinutes ?? 0) + value;
      else sport.missingDuration++;
    }
  }
  const sports = [...bySport.values()];
  return {
    minutes: sports.reduce((sum, sport) => sum + sport.plannedMinutes, 0),
    completed,
    total,
    sports,
  };
}

export type WeeklyTrainingOverview = ReturnType<typeof weeklyTrainingOverview>;

export function sessionPurpose(description: string | null | undefined) {
  return description?.match(/^Objetivo desta sessão:[ \t]*(.+)$/m)?.[1]?.trim() || null;
}
