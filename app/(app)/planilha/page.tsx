import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { PlanilhaClient } from './_components/planilha-client';
import { redirect } from 'next/navigation';

export default async function PlanilhaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const plans = await prisma.trainingPlan.findMany({ where: { userId, status: 'active' }, orderBy: { createdAt: 'desc' }, take: 1 });
  const plan = plans?.[0] ?? null;
  let workouts: any[] = [];
  if (plan) {
    workouts = await prisma.workout.findMany({ where: { planId: plan.id }, orderBy: [{date:'asc'},{partOrder:'asc'}], include: { log: true } });
  }
  // Indica se a chave do Intervals.icu do DONO do plano ja esta salva (para o envio direto).
  const ownerProfile = plan ? await prisma.athleteProfile.findUnique({ where: { userId: plan.userId }, select: { intervalsIcuApiKey: true, currentWeight: true, carbohydrateRateGPerHour: true } }) : null;
  const hasIntervalsKey = !!ownerProfile?.intervalsIcuApiKey;
  return (
    <PlanilhaClient
      plan={plan ? JSON.parse(JSON.stringify(plan)) : null}
      workouts={JSON.parse(JSON.stringify(workouts ?? []))}
      hasIntervalsKey={hasIntervalsKey}
      metricProfile={ownerProfile ? { currentWeight: ownerProfile.currentWeight, carbohydrateRateGPerHour: ownerProfile.carbohydrateRateGPerHour } : null}
    />
  );
}
