export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

// Cria um plano VAZIO para o coach montar a planilha manualmente, treino a treino.
// Determinístico e gratuito (não usa IA/créditos).
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const role = (session.user as any).role;

  let targetUserId: string | undefined;
  try { const b = await req.json(); targetUserId = b?.targetUserId; } catch {}
  // Coach pode criar para um atleta específico; atleta cria apenas para si
  const userId = (role === 'coach' && targetUserId) ? String(targetUserId) : session.user.id;

  // Arquiva planos ativos anteriores para manter apenas um plano ativo por atleta
  await prisma.trainingPlan.updateMany({ where: { userId, status: 'active' }, data: { status: 'archived' } });

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
