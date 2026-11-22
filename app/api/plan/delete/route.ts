export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await req.json();
  if (!id)
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  // Coach pode excluir qualquer plano; atleta apenas o próprio
  const where = { id, userId: session.user.id };
  const plan = await prisma.trainingPlan.findFirst({ where });
  if (!plan)
    return NextResponse.json(
      { error: 'Plano não encontrado' },
      { status: 404 },
    );

  if (
    await prisma.workout.count({
      where: {
        planId: plan.id,
        OR: [{ completed: true }, { coachManaged: true }],
      },
    })
  )
    return Response.json(
      {
        error:
          'Plano contém histórico realizado ou prescrição do coach. Preserve o plano e solicite revisão.',
      },
      { status: 409 },
    );
  // Remove os treinos vinculados a este plano e depois o plano
  await prisma.workout.deleteMany({ where: { planId: id } });
  await prisma.trainingPlan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
