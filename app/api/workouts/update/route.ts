export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { editWorkoutStructure } from '@/lib/workout-edit';
import {
  calendarDay,
  describeStructure,
  readWorkoutStructure,
} from '@/lib/training-structure';
import { z } from 'zod';

const patchSchema = z.object({
  id: z.string().min(1).max(128),
  planId: z.string().max(128).nullable().optional(),
  title: z.string().trim().min(1).max(250).optional(),
  description: z.string().max(20000).optional(),
  duration: z.coerce.number().int().min(1).max(1440).optional(),
  targetZone: z.enum(['Z1', 'Z2', 'Z3', 'Z4', 'Z5']).nullable().optional(),
  modality: z.enum(['corrida', 'ciclismo', 'natacao', 'forca']).optional(),
  date: z
    .string()
    .refine((value) => calendarDay(value) !== null, 'Data inválida.')
    .optional(),
  phase: z.string().max(40).nullable().optional(),
  weekNumber: z.coerce.number().int().min(1).max(104).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error: 'Confira os campos da sessão.',
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 422 },
    );
  const body = parsed.data;
  const {
    id,
    planId,
    title,
    description,
    duration,
    targetZone,
    modality,
    date,
    phase,
    weekNumber,
  } = body ?? {};
  if (!id)
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  const where = { id, userId: session.user.id };
  const existing = await prisma.workout.findFirst({ where });
  if (!existing)
    return NextResponse.json(
      { error: 'Treino não encontrado' },
      { status: 404 },
    );

  if (existing.completed || existing.coachManaged)
    return Response.json(
      {
        error:
          'Histórico realizado e prescrição publicada do coach são preservados. Solicite revisão na Área do Coach.',
      },
      { status: 409 },
    );
  const data: any = {};
  if (planId !== undefined) {
    if (planId) {
      const plan = await prisma.trainingPlan.findFirst({
        where: { id: String(planId), userId: existing.userId },
      });
      if (!plan)
        return NextResponse.json(
          { error: 'Plano não encontrado para este atleta' },
          { status: 404 },
        );
      data.planId = plan.id;
    } else {
      data.planId = null;
    }
  }
  if (title !== undefined) data.title = String(title);
  if (description !== undefined) data.description = String(description);
  if (duration !== undefined)
    data.duration = Number(duration) || existing.duration;
  if (targetZone !== undefined) data.targetZone = targetZone || null;
  if (modality !== undefined) data.modality = String(modality);
  if (date !== undefined) data.date = new Date(date);
  if (phase !== undefined) data.phase = phase || null;
  if (weekNumber !== undefined) data.weekNumber = weekNumber;

  if (
    existing.structure &&
    (duration !== undefined ||
      targetZone !== undefined ||
      modality !== undefined)
  ) {
    const profile = await prisma.athleteProfile.findUnique({
      where: { userId: existing.userId },
    });
    try {
      const original = readWorkoutStructure(existing.structure);
      const structure = editWorkoutStructure(
        existing.structure,
        data.duration ?? existing.duration,
        data.modality ?? existing.modality,
        targetZone ?? null,
        profile,
      );
      const previous = String(description ?? existing.description ?? '');
      const notes = original
        ? previous.replace(describeStructure(original), '').trim()
        : previous;
      data.structure = JSON.parse(JSON.stringify(structure));
      data.tssEstimate = null;
      data.targetZone =
        structure.steps
          .filter((step) => step.kind === 'principal' && step.zone)
          .sort(
            (a, b) => Number(b.zone!.slice(1)) - Number(a.zone!.slice(1)),
          )[0]?.zone || 'Z1';
      data.description = [
        describeStructure(structure),
        notes
          ? `Observação preservada da edição (não substitui os blocos acima):\n${notes}`
          : '',
      ]
        .filter(Boolean)
        .join('\n\n');
    } catch {
      return NextResponse.json(
        {
          error:
            'Não foi possível preservar os blocos com estes valores. Revise a duração e a estrutura.',
        },
        { status: 422 },
      );
    }
  }
  const updated = await prisma.workout.update({
    where: { id: existing.id, userId: existing.userId },
    data,
  });
  return NextResponse.json({
    ok: true,
    workout: JSON.parse(JSON.stringify(updated)),
  });
}
