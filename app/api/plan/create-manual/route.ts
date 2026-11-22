import { canAccessAthlete } from '@/lib/coach-access';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

// Cria um plano VAZIO para o coach montar a planilha manualmente, treino a treino.
// Determinístico e gratuito (não usa IA/créditos).
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const role = (session.user as any).role;

  let targetUserId: string | undefined;
  try {
    const b = await req.json();
    targetUserId = b?.targetUserId;
  } catch {}
  // Coach pode criar para um atleta específico; atleta cria apenas para si
  const userId =
    role === 'coach' && targetUserId ? String(targetUserId) : session.user.id;

  if (userId !== session.user.id) {
    if (!(await canAccessAthlete(session.user, userId)))
      return Response.json(
        { error: 'Vínculo ativo não encontrado.' },
        { status: 404 },
      );
    return Response.json(
      { error: 'Crie uma proposta na Área do Coach e publique após revisar.' },
      { status: 409 },
    );
  }
  if (
    await prisma.workout.count({
      where: {
        userId,
        coachManaged: true,
        completed: false,
        date: { gte: new Date(new Date().toISOString().slice(0, 10)) },
        OR: [{ planId: null }, { plan: { status: 'active' } }],
      },
    })
  )
    return Response.json(
      {
        error:
          'Existem sessões publicadas pelo coach. Solicite uma proposta revisada na Área do Coach; o plano atual foi preservado.',
      },
      { status: 409 },
    );
  // Arquiva planos ativos anteriores para manter apenas um plano ativo por atleta
  await prisma.trainingPlan.updateMany({
    where: { userId, status: 'active' },
    data: { status: 'archived' },
  });

  const now = new Date();
  const plan = await prisma.trainingPlan.create({
    data: {
      userId,
      name: `Planilha manual - ${now.toLocaleDateString('pt-BR')}`,
      startDate: now,
      endDate: now,
      generatedBy: 'manual',
    },
  });

  return NextResponse.json({ planId: plan.id });
}
