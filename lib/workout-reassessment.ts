import {markRunningThreshold} from './training-audit';
import type { Prisma } from '@prisma/client';
import {
  readWorkoutStructure,
  describeStructure,
  distributionForSteps,
} from './training-structure';
import { targetForZone } from './training-zones';
import { dayKey, preferences } from './planning-preferences';
import { weekStart } from './calendar-period';
import type { TrainingProfile } from './training-types';

export function retargetBike(input: unknown, profile: TrainingProfile) {
  const structure = readWorkoutStructure(input);
  if (!structure || structure.modality !== 'ciclismo') return null;
  const steps = structure.steps.map((step) => ({
    ...step,
    ...(step.zone && step.rest !== 'passivo'
      ? { target: targetForZone(profile, 'ciclismo', step.zone) }
      : {}),
  }));
  const result={
    ...structure,
    steps,
    distribution: distributionForSteps(steps, 'ciclismo'),
    requiresCoachReview: true,
    warnings: [
      ...new Set([
        ...structure.warnings,
        'Alvos atualizados após mudança de FTP/equipamento. Revisar tolerância antes da sessão; histórico concluído preservado.',
      ]),
    ],
  };
  delete result.thresholdReference;markRunningThreshold(result,profile);
  return result;
}
export async function refreshFutureBikeTargets(
  tx: Prisma.TransactionClient,
  userId: string,
  previous: TrainingProfile | null,
  profile: TrainingProfile,
  now = new Date(),
) {
  if (
    ['ftp', 'testFTPEstimated', 'hasPowerMeter', 'hasTrainer'].every(
      (key) => (previous as any)?.[key] === (profile as any)[key],
    )
  )
    return 0;
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const workouts = await tx.workout.findMany({
    where: {
      userId,
      modality: 'ciclismo',
      coachManaged: false,
      completed: false,
      date: { gte: new Date(today + 'T00:00:00Z') },
      OR: [{ planId: null }, { plan: { status: 'active' } }],
    },
  });
  let count = 0;
  for (const workout of workouts) {
    const updated = retargetBike(workout.structure, profile);
    if (!updated) continue;
    const old = readWorkoutStructure(workout.structure);
    const notes = old
      ? (workout.description || '').replace(describeStructure(old), '').trim()
      : workout.description;
    await tx.workout.update({
      where: { id: workout.id, userId },
      data: {
        structure: JSON.parse(JSON.stringify(updated)),
        description:
          describeStructure(updated) +
          (notes ? '\n\nObservação preservada:\n' + notes : ''),
      },
    });
    count++;
  }
  return count;
}
type Entry = {
  id?: string;
  date: Date | string;
  duration: number;
  completed?: boolean;
  paused?: boolean;
  modality?: string;
  structure?: unknown;
};
export function reviewWeek(
  workouts: Entry[],
  profile: TrainingProfile | null,
  anchor: string,
  now = new Date(),
) {
  const start = weekStart(anchor),
    end = new Date(new Date(start + 'T00:00:00Z').getTime() + 7 * 86400000)
      .toISOString()
      .slice(0, 10);
  const active = workouts.filter((w) => !w.paused),
    week = active.filter(
      (w) =>
        new Date(w.date).toISOString().slice(0, 10) >= start &&
        new Date(w.date).toISOString().slice(0, 10) < end,
    );
  const prefs = preferences(profile?.planningPreferences),
    warnings: string[] = [],
    byDay: Record<string, number> = {};
  for (const item of week) {
    const day = new Date(item.date).toISOString().slice(0, 10),
      key = dayKey(item.date);
    byDay[day] = (byDay[day] || 0) + item.duration;
    if (!(profile?.availableDays || []).includes(key))
      warnings.push(
        'Há treino em dia indisponível: mover para um dia permitido ou pausar.',
      );
    if (item.duration > (prefs.maxSessionMinutes ?? 480))
      warnings.push(
        'Uma sessão excede o tempo máximo informado. Encurtar e revisar os blocos.',
      );
    if (prefs.preferred?.descanso?.includes(key))
      warnings.push('Há treino em dia reservado para descanso.');
  }
  for (const [day, minutes] of Object.entries(byDay)) {
    const key = dayKey(day),
      cap = Number((profile?.dailyMinutes as any)?.[key]);
    if (Number.isFinite(cap) && minutes > cap)
      warnings.push(
        'Soma das sessões ultrapassa a disponibilidade diária. Não comprimir a semana.',
      );
    if (
      prefs.doubleDays &&
      week.filter((w) => w.modality!=='descanso' && new Date(w.date).toISOString().startsWith(day))
        .length > (prefs.doubleDays.includes(key) ? 2 : 1)
    )
      warnings.push('Há mais sessões no dia do que foi permitido.');
  }
  const quality = active
    .filter((w) => {
      const s = readWorkoutStructure(w.structure);
      return (
        s && s.distribution.moderateSeconds + s.distribution.highSeconds > 0
      );
    })
    .map((w) => new Date(w.date).getTime())
    .sort((a, b) => a - b);
  if (
    quality.some(
      (date, i) =>
        i > 0 &&
        date - quality[i - 1] < 2 * 86400000 &&
        new Date(date).toISOString().slice(0, 10) >= start &&
        new Date(date).toISOString().slice(0, 10) < end,
    )
  )
    warnings.push(
      'Sessões moderadas/fortes a menos de 48h: separar estímulos, substituir por leve ou pausar; revisar com o coach.',
    );
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const missed = week.filter(
    (w) => !w.completed && new Date(w.date).toISOString().slice(0, 10) < today,
  ).length;
  if (missed)
    warnings.push(
      `${missed} treino(s) não concluído(s): não acumular intensidade para compensar. Reavaliar disponibilidade e recuperação.`,
    );
  const alternatives = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(
        new Date(start + 'T00:00:00Z').getTime() + i * 86400000,
      )
        .toISOString()
        .slice(0, 10),
      key = dayKey(day);
    if (
      day < today ||
      !profile?.availableDays?.includes(key) ||
      prefs.preferred?.descanso?.includes(key)
    )
      continue;
    const count = week.filter(
      (w) => w.modality!=='descanso' && new Date(w.date).toISOString().slice(0, 10) === day,
    ).length;
    if (prefs.doubleDays && count >= (prefs.doubleDays.includes(key) ? 2 : 1))
      continue;
    const candidateTime = new Date(day + 'T12:00:00Z').getTime();
    if (
      quality.some(
        (time) =>
          Math.abs(
            candidateTime -
              new Date(
                new Date(time).toISOString().slice(0, 10) + 'T12:00:00Z',
              ).getTime(),
          ) <
          2 * 86400000,
      )
    )
      continue;
    const cap = Number(
      (profile.dailyMinutes as any)?.[key] ??
        (profile.level === 'iniciante'
          ? 90
          : profile.level === 'avancado'
            ? 360
            : 240),
    );
    const left = Math.min(
      cap - (byDay[day] || 0),
      prefs.maxSessionMinutes ?? 480,
    );
    if (left >= 10) alternatives.push({ date: day, availableMinutes: left });
  }
  return {
    start,
    end,
    plannedMinutes: week.reduce((sum, w) => sum + w.duration, 0),
    warnings: [...new Set(warnings)],
    alternatives,
    reason:
      'Encaixes indicam espaço de agenda, não liberação fisiológica. Nenhuma sessão restante foi alterada automaticamente.',
  };
}
