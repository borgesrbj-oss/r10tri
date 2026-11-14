export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const role = (session.user as any).role;
  const body = await req.json();
  const { id, planId, title, description, duration, targetZone, modality, date, phase, weekNumber } = body ?? {};
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  const where = role === 'coach' ? { id } : { id, userId: session.user.id };
  const existing = await prisma.workout.findFirst({ where });
  if (!existing) return NextResponse.json({ error: 'Treino não encontrado' }, { status: 404 });

  const data: any = {};
  if (planId !== undefined) {
    if (planId) {
      const plan = await prisma.trainingPlan.findFirst({ where: { id: String(planId), userId: existing.userId } });
      if (!plan) return NextResponse.json({ error: 'Plano não encontrado para este atleta' }, { status: 404 });
      data.planId = plan.id;
    } else {
      data.planId = null;
    }
  }
  if (title !== undefined) data.title = String(title);
  if (description !== undefined) data.description = String(description);
  if (duration !== undefined) data.duration = Number(duration) || existing.duration;
  if (targetZone !== undefined) data.targetZone = targetZone || null;
  if (modality !== undefined) data.modality = String(modality);
  if (date !== undefined) data.date = new Date(date);
  if (phase !== undefined) data.phase = phase || null;
  if (weekNumber !== undefined) data.weekNumber = weekNumber != null && weekNumber !== '' ? Number(weekNumber) : null;

  const updated = await prisma.workout.update({ where: { id: existing.id, userId: existing.userId }, data });
  return NextResponse.json({ ok: true, workout: JSON.parse(JSON.stringify(updated)) });
}
