export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const role = (session.user as any).role;
  const body = await req.json();
  const { targetUserId, planId, title, description, duration, targetZone, modality, date, weekNumber, phase } = body ?? {};

  // Coach pode criar treino para um atleta; atleta cria para si
  const userId = (role === 'coach' && targetUserId) ? String(targetUserId) : session.user.id;
  if (!title || !modality || !date) return NextResponse.json({ error: 'Título, modalidade e data são obrigatórios' }, { status: 400 });

  // Se planId informado, valida posse
  let validPlanId: string | null = null;
  if (planId) {
    const plan = await prisma.trainingPlan.findFirst({ where: { id: String(planId), userId } });
    if (!plan) return NextResponse.json({ error: 'Plano não encontrado para este atleta' }, { status: 404 });
    validPlanId = plan.id;
  }

  const workout = await prisma.workout.create({
    data: {
      userId,
      planId: validPlanId,
      date: new Date(date),
      modality: String(modality),
      title: String(title),
      description: String(description || ''),
      duration: Number(duration) || 60,
      targetZone: targetZone || null,
      weekNumber: weekNumber ? Number(weekNumber) : null,
      phase: phase || null,
    },
  });
  return NextResponse.json({ ok: true, workout: JSON.parse(JSON.stringify(workout)) });
}
