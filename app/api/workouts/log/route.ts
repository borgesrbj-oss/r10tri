export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  const data = await req.json().catch(() => null);
  if (!data || typeof data !== 'object' || Array.isArray(data))
    return NextResponse.json(
      { error: 'Envie os dados do registro em JSON.' },
      { status: 400 },
    );
  if (typeof data.workoutId !== 'string' || !data.workoutId) {
    return NextResponse.json(
      { error: 'ID do treino é obrigatório' },
      { status: 400 },
    );
  }
  const workout = await prisma.workout.findFirst({
    where: { id: data.workoutId, userId: session.user.id },
  });
  if (!workout)
    return NextResponse.json(
      { error: 'Treino não encontrado' },
      { status: 404 },
    );

  if (workout.paused)
    return NextResponse.json(
      { error: 'Retome a sessão antes de registrar a conclusão.' },
      { status: 409 },
    );
  const fields: Record<string, [number, number, boolean]> = {
    actualDuration: [0, 1440, true],
    actualDistance: [0, 1000, false],
    rpe: [1, 10, true],
    weight: [1, 500, false],
    heartRateAvg: [20, 260, true],
    sleepHours: [0, 24, false],
    fatigueScore: [0, 10, true],
    painScore: [0, 10, true],
  };
  const values: Record<string, number | null> = {};
  for (const [field, [min, max, integer]] of Object.entries(fields)) {
    if (data[field] === undefined) continue;
    if (data[field] === null || data[field] === '') {
      values[field] = null;
      continue;
    }
    const value =
      typeof data[field] === 'number' || typeof data[field] === 'string'
        ? Number(data[field])
        : NaN;
    if (
      !Number.isFinite(value) ||
      value < min ||
      value > max ||
      (integer && !Number.isInteger(value))
    )
      return NextResponse.json(
        { error: 'Confira os valores do check-in e do treino.', field },
        { status: 422 },
      );
    values[field] = value;
  }
  if (
    data.notes !== undefined &&
    data.notes !== null &&
    (typeof data.notes !== 'string' || data.notes.length > 4000)
  )
    return NextResponse.json(
      { error: 'As observações devem ter até 4000 caracteres.' },
      { status: 422 },
    );

  try {
    const log = await prisma.$transaction(async (transaction) => {
      const changed = await transaction.workout.updateMany({
        where: {
          id: workout.id,
          userId: session.user.id,
          updatedAt: workout.updatedAt,
          paused: false,
        },
        data: { completed: true },
      });
      if (changed.count !== 1) throw new Error('STALE_WORKOUT');
      const saved = await transaction.workoutLog.upsert({
        where: { workoutId: data.workoutId },
        update: { ...values, notes: data.notes },
        create: {
          workoutId: data.workoutId,
          userId: session.user.id,
          ...values,
          notes: data.notes,
        },
      });

      if (values.weight) {
        await transaction.weightLog.create({
          data: { userId: session.user.id, weight: values.weight },
        });
      }
      return saved;
    });
    return NextResponse.json(log);
  } catch (error) {
    if (error instanceof Error && error.message === 'STALE_WORKOUT')
      return NextResponse.json(
        {
          error:
            'O treino foi alterado durante o registro. Atualize o calendário e confira a prescrição antes de concluir.',
        },
        { status: 409 },
      );
    throw error;
  }
}
