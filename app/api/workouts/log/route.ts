export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  const data = await req.json();
  if (typeof data.workoutId !== 'string' || !data.workoutId) {
    return NextResponse.json({ error: 'ID do treino é obrigatório' }, { status: 400 });
  }
  const workout = await prisma.workout.findFirst({ where: { id: data.workoutId, userId: session.user.id } });
  if (!workout) return NextResponse.json({ error: 'Treino não encontrado' }, { status: 404 });

  const log = await prisma.$transaction(async (transaction) => {
    const saved = await transaction.workoutLog.upsert({
      where: { workoutId: data.workoutId },
      update: { actualDuration: data.actualDuration, actualDistance: data.actualDistance, rpe: data.rpe, weight: data.weight, notes: data.notes, heartRateAvg: data.heartRateAvg },
      create: { workoutId: data.workoutId, userId: session.user.id, actualDuration: data.actualDuration, actualDistance: data.actualDistance, rpe: data.rpe, weight: data.weight, notes: data.notes, heartRateAvg: data.heartRateAvg },
    });
    await transaction.workout.update({ where: { id: workout.id, userId: session.user.id }, data: { completed: true } });
    if (data.weight) {
      await transaction.weightLog.create({ data: { userId: session.user.id, weight: data.weight } });
    }
    return saved;
  });
  return NextResponse.json(log);
}
