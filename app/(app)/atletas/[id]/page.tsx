export const dynamic = 'force-dynamic';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { AtletaManageClient } from './_components/atleta-manage-client';

export default async function AtletaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if ((session.user as any)?.role !== 'coach') redirect('/dashboard');
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id }, include: { profile: true } });
  if (!user) redirect('/atletas');

  const plans = await prisma.trainingPlan.findMany({ where: { userId: id, status: 'active' }, orderBy: { createdAt: 'desc' }, take: 1 });
  const plan = plans?.[0] ?? null;
  let workouts: any[] = [];
  if (plan) workouts = await prisma.workout.findMany({ where: { planId: plan.id }, orderBy: { date: 'asc' } });
  const messages = await prisma.coachMessage.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 50 });

  return (
    <AtletaManageClient
      athlete={{ id: user.id, name: user.name ?? 'Atleta', email: user.email, photoUrl: user.profile?.photoUrl ?? null, modality: user.profile?.modality ?? null, level: user.profile?.level ?? null, whatsapp: user.profile?.whatsapp ?? null }}
      plan={plan ? JSON.parse(JSON.stringify(plan)) : null}
      workouts={JSON.parse(JSON.stringify(workouts ?? []))}
      messages={JSON.parse(JSON.stringify(messages ?? []))}
    />
  );
}
