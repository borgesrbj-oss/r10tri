import { publicProfile } from '@/lib/profile-public';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { PlanoClient } from './_components/plano-client';
import { redirect } from 'next/navigation';

export default async function PlanoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;
  
  const profile = await prisma.athleteProfile.findUnique({ where: { userId } });
  const plans = await prisma.trainingPlan.findMany({ where: { userId, status: 'active' }, orderBy: { createdAt: 'desc' }, take: 1 });
  const plan = plans?.[0] ?? null;
  const races = await prisma.targetRace.findMany({ where: { userId, date: { gte: new Date() } }, orderBy: {date:'asc'} });
  let workouts: any[] = [];
  if (plan) {
    workouts = await prisma.workout.findMany({ where: { planId: plan.id }, orderBy: [{date:'asc'},{partOrder:'asc'}], include: { log: true } });
  }
  return (
    <PlanoClient
      plan={plan ? JSON.parse(JSON.stringify(plan)) : null}
      workouts={JSON.parse(JSON.stringify(workouts ?? []))}
      profile={profile ? JSON.parse(JSON.stringify(publicProfile(profile))) : null}
      races={JSON.parse(JSON.stringify(races ?? []))}
    />
  );
}
