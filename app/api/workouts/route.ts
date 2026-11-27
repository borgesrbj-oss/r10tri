export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { BRICK_ADJUSTMENT_MESSAGE } from '@/lib/workout-adjustment';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');
  const where: any = { userId: session.user.id };
  if (startDate && endDate) {
    where.date = { gte: new Date(startDate), lte: new Date(endDate) };
  }
  const workouts = await prisma.workout.findMany({
    where,
    orderBy: [{date:'asc'},{partOrder:'asc'}],
    include: { log: true },
  });
  return NextResponse.json(workouts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  const data = await req.json();
  if (data.id) {
    const where = { id: data.id, userId: session.user.id };
    const workout = await prisma.workout.findFirst({ where });
    if (!workout)
      return NextResponse.json(
        { error: 'Treino não encontrado' },
        { status: 404 },
      );
    if (workout.completed || workout.coachManaged)
      return Response.json(
        {
          error:
            'Histórico realizado e prescrição publicada do coach são preservados. Solicite revisão na Área do Coach.',
        },
        { status: 409 },
      );
    if (workout.brickGroupId)
      return Response.json({ error: BRICK_ADJUSTMENT_MESSAGE }, { status: 409 });
    const w = await prisma.workout.update({
      where: { id: workout.id, userId: workout.userId },
      data: {
        title: data.title,
        description: data.description,
        duration: data.duration,
        targetZone: data.targetZone,
        modality: data.modality,
        date: data.date ? new Date(data.date) : undefined,
        completed: data.completed,
      },
    });
    return NextResponse.json(w);
  }
  if (data.planId) {
    const plan = await prisma.trainingPlan.findFirst({
      where: { id: String(data.planId), userId: session.user.id },
    });
    if (!plan)
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 },
      );
  }
  const w = await prisma.workout.create({
    data: {
      userId: session.user.id,
      planId: data.planId,
      date: new Date(data.date),
      modality: data.modality,
      title: data.title,
      description: data.description ?? '',
      duration: data.duration ?? 60,
      targetZone: data.targetZone,
      tssEstimate: data.tssEstimate,
      phase: data.phase,
      weekNumber: data.weekNumber,
    },
  });
  return NextResponse.json(w, { status: 201 });
}
