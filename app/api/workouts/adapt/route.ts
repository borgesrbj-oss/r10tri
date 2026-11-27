import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { calendarDay } from '@/lib/calendar-day';
import { weekStart } from '@/lib/calendar-period';
import { describeStructure, readWorkoutStructure } from '@/lib/training-structure';
import { plannedWorkoutMetrics } from '@/lib/triathlon-metrics';
import { editWorkoutStructure, lighterWorkoutStructure } from '@/lib/workout-edit';
import { BRICK_ADJUSTMENT_MESSAGE, reviewWorkoutAdjustment } from '@/lib/workout-adjustment';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const supportedModalities = ['corrida', 'ciclismo', 'natacao', 'forca'] as const;
const modalitySchema = z.enum(supportedModalities);
const requestSchema = z.object({
  id: z.string().min(1).max(128),
  action: z.enum(['pausar', 'retomar', 'encurtar', 'substituir', 'mover', 'leve']),
  minutes: z.number().int().min(4).max(480).optional(),
  modality: modalitySchema.optional(),
  date: z.iso.date().optional(),
  preview: z.literal(true).optional(),
  expectedPreview: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});
const modalityTitles = { corrida: 'Corrida', ciclismo: 'Ciclismo', natacao: 'Natação', forca: 'Força' };
const DAY = 86_400_000;
const options = { headers: { 'Cache-Control': 'no-store' } };
const dayString = (date: Date) => date.toISOString().slice(0, 10);

class AdjustmentError extends Error {
  constructor(message: string, readonly status = 422) {
    super(message);
  }
}

function weekRange(start: string) {
  const monday = new Date(start + 'T00:00:00Z').getTime();
  return { gte: new Date(monday - 2 * DAY), lt: new Date(monday + 9 * DAY) };
}

function planWeekOf(date: Date, startsOn: Date) {
  return 1 + Math.floor((calendarDay(date)!.getTime() - calendarDay(startsOn)!.getTime()) / (7 * DAY));
}

export async function POST(req: Request) {
  const userId = (await auth())?.user?.id;
  if (!userId) return Response.json({ error: 'Não autorizado' }, { ...options, status: 401 });
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Confira a ação, a duração ou a data.' }, { ...options, status: 422 });
  const input = parsed.data;

  try {
    return await prisma.$transaction(async (tx) => {
      const workout = await tx.workout.findFirst({
        where: { id: input.id, userId },
        include: { plan: { select: { status: true, startDate: true, endDate: true, summary: true } } },
      });
      if (!workout) throw new AdjustmentError('Treino não encontrado.', 404);
      if (workout.completed || workout.coachManaged || (workout.plan && workout.plan.status !== 'active')) {
        throw new AdjustmentError('A edição está disponível para treinos pendentes do plano ativo. Para ajustar uma sessão publicada pelo coach, solicite sua revisão.', 409);
      }
      if (workout.brickGroupId) throw new AdjustmentError(BRICK_ADJUSTMENT_MESSAGE, 409);
      const requestedDate = input.date ? calendarDay(input.date) : null;
      if (input.action === 'mover' && !requestedDate) throw new AdjustmentError('Escolha a nova data.');
      const date = input.action === 'mover' && requestedDate ? requestedDate : workout.date;
      const originalDate = dayString(workout.date);
      const destination = dayString(date);
      const summary = workout.plan?.summary as {
        calculation?: { inputs?: { startDate?: string; endDate?: string } };
        weeks?: { weekNumber: number; phase: string }[];
      } | null;
      const bounds = summary?.calculation?.inputs;
      const planStart = (bounds?.startDate && calendarDay(bounds.startDate)) || workout.plan?.startDate;
      const planEnd = (bounds?.endDate && calendarDay(bounds.endDate)) || workout.plan?.endDate;
      if (input.action === 'mover') {
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        if (destination < today) throw new AdjustmentError('Escolha hoje ou um dia futuro.');
        if (destination === originalDate) throw new AdjustmentError('Escolha um dia diferente do atual.');
        if (planStart && planEnd && (destination < dayString(planStart) || destination > dayString(planEnd))) {
          throw new AdjustmentError('Escolha um dia dentro do plano ou replaneje o ciclo.');
        }
      }

      const [profile, calendar, races] = await Promise.all([
        tx.athleteProfile.findUnique({ where: { userId } }),
        tx.workout.findMany({
          where: {
            userId,
            AND: [
              { OR: [{ planId: null }, { plan: { status: 'active' } }] },
              { OR: [...new Set([weekStart(originalDate), weekStart(destination)])].map((start) => ({ date: weekRange(start) })) },
            ],
          },
          select: { id: true, date: true, paused: true, modality: true, duration: true, structure: true, targetZone: true },
        }),
        tx.targetRace.findMany({
          where: { userId, date: { gte: new Date(destination + 'T00:00:00Z'), lt: new Date(new Date(destination + 'T00:00:00Z').getTime() + DAY) } },
          select: { date: true },
        }),
      ]);
      const currentStructure = readWorkoutStructure(workout.structure);
      const proposed = { ...workout, date };
      const data: Prisma.WorkoutUncheckedUpdateInput = {};
      if (input.action === 'pausar' || input.action === 'retomar') {
        proposed.paused = data.paused = input.action === 'pausar';
      } else if (input.action === 'mover') {
        data.date = date;
        if (planStart && workout.weekNumber != null) {
          const newWeek = planWeekOf(date, planStart);
          const phase = Array.isArray(summary?.weeks) ? summary.weeks.find((week) => week.weekNumber === newWeek)?.phase : undefined;
          if (phase && workout.phase && phase !== workout.phase && newWeek !== workout.weekNumber) {
            throw new AdjustmentError('A data pertence a outra fase. Reveja o treino na nova fase antes de mover.');
          }
          data.weekNumber = newWeek;
        }
      } else {
        if (!currentStructure) throw new AdjustmentError('Sessão sem estrutura válida. Revise os blocos antes de editar.');
        if (input.action === 'encurtar' && (input.minutes == null || input.minutes >= workout.duration)) {
          throw new AdjustmentError('Informe duração menor que a atual, com pelo menos 4 minutos.');
        }
        if (input.action === 'substituir' && !input.modality) throw new AdjustmentError('Escolha a modalidade.');
        const modality = input.action === 'substituir' && input.modality ? input.modality : currentStructure.modality;
        if (modality === 'natacao' && input.action === 'substituir' && (profile?.canSwim === false || (profile?.hasPoolAccess === false && profile?.poolSize !== 'mar_aberto'))) {
          throw new AdjustmentError('Confira o acesso à água e o nível de natação na triagem.');
        }
        let structure;
        try {
          structure = input.action === 'leve'
            ? lighterWorkoutStructure(currentStructure, profile)
            : editWorkoutStructure(workout.structure, input.minutes ?? workout.duration, modality, null, profile);
        } catch (error) {
          throw new AdjustmentError(error instanceof Error ? error.message : 'Revise os blocos antes de editar.');
        }
        proposed.modality = data.modality = modality;
        proposed.duration = data.duration = structure.durationSeconds / 60;
        proposed.targetZone = data.targetZone = structure.steps
          .filter((step) => step.kind === 'principal' && step.zone)
          .sort((a, b) => Number(b.zone!.slice(1)) - Number(a.zone!.slice(1)))[0]?.zone ?? 'Z1';
        proposed.structure = data.structure = JSON.parse(JSON.stringify(structure));
        if (input.action === 'leve') data.title = 'Versão leve · ' + modalityTitles[modality];
        if (input.action === 'substituir') data.title = 'Sessão substituída · ' + modalityTitles[modality];
        const observations = workout.description.replace(describeStructure(currentStructure), '').trim();
        data.description = [describeStructure(structure), observations && 'Observações anteriores:\n' + observations].filter(Boolean).join('\n\n');
        data.tssEstimate = plannedWorkoutMetrics(structure, profile).tssEstimate;
      }
      const review = reviewWorkoutAdjustment(workout, proposed, calendar, profile, races.map((race) => race.date));
      const numbers = {
        duration: proposed.duration,
        modality: proposed.modality,
        date: destination,
        targetZone: proposed.targetZone,
        paused: proposed.paused,
        description: data.description ?? (currentStructure ? describeStructure(currentStructure) : undefined),
        review,
      };
      const previewId = createHash('sha256').update(JSON.stringify([workout.id, workout.updatedAt, input.action, data, numbers])).digest('hex');
      if (input.preview) return Response.json({ previewId, ...numbers }, options);
      if (input.expectedPreview != null && input.expectedPreview !== previewId) {
        throw new AdjustmentError('A agenda mudou desde a prévia. Confira a proposta atualizada.', 409);
      }
      if ((input.action === 'leve' || input.action === 'mover') && !input.expectedPreview) {
        throw new AdjustmentError('Revise a prévia antes de confirmar.', 409);
      }
      if (review.conflicts.length) throw new AdjustmentError(review.conflicts.join(' '), 409);
      const changed = await tx.workout.updateMany({
        where: { id: workout.id, userId, updatedAt: workout.updatedAt, completed: false, coachManaged: false, brickGroupId: null },
        data,
      });
      if (changed.count !== 1) throw new AdjustmentError('O treino mudou. Atualize a agenda antes de confirmar.', 409);
      return Response.json({ ok: true, date: destination, message: 'Treino atualizado.' }, options);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof AdjustmentError) return Response.json({ error: error.message }, { ...options, status: error.status });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return Response.json({ error: 'A agenda mudou. Gere uma nova prévia.' }, { ...options, status: 409 });
    }
    throw error;
  }
}
