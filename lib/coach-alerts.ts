import { assessmentReadiness } from './assessment-validation';

const DAY_MS = 24 * 60 * 60 * 1000;
export const COACH_ALERT_ATHLETE_LIMIT = 100;

export type CoachAlertProfile = {
  birthDate: Date | string | null;
  currentWeight: number | null;
  level: string;
  weeklyHours: number | null;
  availableDays: string[];
  modality: string;
};
export type CoachAlertAthlete = {
  id: string;
  name: string | null;
  createdAt: Date | string;
  profile: CoachAlertProfile | null;
  latestLog: { completedAt: Date | string; painScore: number | null; fatigueScore: number | null; sleepHours: number | null } | null;
  overdueWorkouts: number;
  weeklyPlannedMinutes: number;
};
export type CoachAlert = {
  kind: 'assessment' | 'inactive' | 'overdue' | 'volume' | 'checkin';
  priority: 'attention' | 'review';
  title: string;
  detail: string;
};
export type CoachAlertReport = {
  generatedAt: string;
  summary: { athletesReviewed: number; athletesWithAlerts: number; totalAlerts: number; checkinsForReview: number };
  athletes: Array<{ id: string; name: string; alerts: CoachAlert[] }>;
};

function validDate(value: Date | string): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

// Treinos são dias de calendário; usa o dia civil de São Paulo e limites UTC para os dias armazenados.
export function coachAlertWindow(now = new Date()) {
  if (!Number.isFinite(now.getTime())) throw new Error('Informe uma data válida para os alertas.');
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const value = (name: string) => parts.find(part => part.type === name)!.value;
  const today = new Date(`${value('year')}-${value('month')}-${value('day')}T00:00:00Z`);
  const weekStart = new Date(today.getTime() - ((today.getUTCDay() + 6) % 7) * DAY_MS);
  return {
    today,
    overdueSince: new Date(today.getTime() - 7 * DAY_MS),
    weekStart,
    weekEnd: new Date(weekStart.getTime() + 7 * DAY_MS),
    inactiveSince: new Date(now.getTime() - 7 * DAY_MS),
  };
}

export function buildCoachAlerts(athletes: readonly CoachAlertAthlete[], now = new Date()): CoachAlertReport {
  const { inactiveSince } = coachAlertWindow(now);
  const withAlerts: CoachAlertReport['athletes'] = [];
  let checkinsForReview = 0;
  for (const athlete of athletes) {
    const alerts: CoachAlert[] = [];
    const readiness = assessmentReadiness(athlete.profile ? { ...athlete.profile } : null);
    if (!readiness.complete) alerts.push({ kind: 'assessment', priority: 'attention', title: 'Triagem incompleta', detail: `Faltam: ${readiness.missing.join(', ')}.` });

    const createdAt = validDate(athlete.createdAt);
    const lastLogAt = athlete.latestLog ? validDate(athlete.latestLog.completedAt) : null;
    const validLastLog = lastLogAt && lastLogAt <= now ? lastLogAt : null;
    if (createdAt && createdAt <= inactiveSince && (!validLastLog || validLastLog <= inactiveSince)) {
      alerts.push({ kind: 'inactive', priority: 'attention', title: 'Sem registros há pelo menos 7 dias', detail: 'Entre em contato para entender a rotina e combinar os próximos registros.' });
    }

    if (Number.isFinite(athlete.overdueWorkouts) && athlete.overdueWorkouts > 0) {
      const count = Math.floor(athlete.overdueWorkouts);
      alerts.push({ kind: 'overdue', priority: 'attention', title: `${count} treino${count === 1 ? '' : 's'} pendente${count === 1 ? '' : 's'}`, detail: 'Treinos dos últimos 7 dias com data anterior a hoje ainda não foram concluídos.' });
    }
    const available = athlete.profile?.weeklyHours;
    if (typeof available === 'number' && Number.isFinite(available) && available > 0 && Number.isFinite(athlete.weeklyPlannedMinutes) && athlete.weeklyPlannedMinutes > available * 60) {
      alerts.push({ kind: 'volume', priority: 'review', title: 'Planejamento acima da disponibilidade', detail: `${Math.round(athlete.weeklyPlannedMinutes)} min planejados nesta semana; disponibilidade informada de ${Math.round(available * 60)} min. Revise a distribuição com o atleta.` });
    }

    const checkin = athlete.latestLog;
    const signals: string[] = [];
    if (validLastLog && checkin) {
      if (typeof checkin.painScore === 'number' && checkin.painScore > 0) signals.push('dor relatada');
      if (typeof checkin.fatigueScore === 'number' && checkin.fatigueScore >= 8) signals.push('fadiga elevada');
      if (typeof checkin.sleepHours === 'number' && Number.isFinite(checkin.sleepHours) && checkin.sleepHours < 6) signals.push('sono abaixo de 6 horas');
    }
    if (signals.length) {
      checkinsForReview++;
      alerts.push({ kind: 'checkin', priority: 'review', title: 'Último check-in pede uma conversa', detail: `Sinais informados: ${signals.join(', ')}. O coach deve revisar o contexto antes de ajustar os treinos.` });
    }
    if (alerts.length) withAlerts.push({ id: athlete.id, name: athlete.name?.trim() || 'Atleta', alerts });
  }
  withAlerts.sort((a, b) => Number(b.alerts.some(alert => alert.priority === 'review')) - Number(a.alerts.some(alert => alert.priority === 'review')) || b.alerts.length - a.alerts.length || a.name.localeCompare(b.name, 'pt-BR'));
  return {
    generatedAt: now.toISOString(),
    summary: { athletesReviewed: athletes.length, athletesWithAlerts: withAlerts.length, totalAlerts: withAlerts.reduce((sum, athlete) => sum + athlete.alerts.length, 0), checkinsForReview },
    athletes: withAlerts,
  };
}
