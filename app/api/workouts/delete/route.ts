export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { BRICK_ADJUSTMENT_MESSAGE } from '@/lib/workout-adjustment';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  const { id } = await req.json();
  if (!id)
    return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });
  const where = { id, userId: session.user.id };
  const w = await prisma.workout.findFirst({ where });
  if (!w)
    return NextResponse.json(
      { error: 'Treino nao encontrado' },
      { status: 404 },
    );
  if (w.completed || w.coachManaged)
    return Response.json(
      {
        error:
          'Histórico realizado e prescrição publicada do coach são preservados. Solicite revisão na Área do Coach.',
      },
      { status: 409 },
    );
  if (w.brickGroupId)
    return Response.json({ error: BRICK_ADJUSTMENT_MESSAGE }, { status: 409 });
  await prisma.workout.delete({ where: { id, userId: session.user.id, completed: false, coachManaged: false, brickGroupId: null } });
  return NextResponse.json({ ok: true });
}
