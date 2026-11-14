import { publicProfile } from '@/lib/profile-public';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { NutricaoClient } from './_components/nutricao-client';
import { redirect } from 'next/navigation';

export default async function NutricaoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const profile = await prisma.athleteProfile.findUnique({ where: { userId } });
  const plans = await prisma.trainingPlan.findMany({ where: { userId, status: 'active' }, orderBy: { createdAt: 'desc' }, take: 1 });
  const plan = plans?.[0] ?? null;

  return (
    <NutricaoClient
      plan={plan ? JSON.parse(JSON.stringify(plan)) : null}
      profile={profile ? JSON.parse(JSON.stringify(publicProfile(profile))) : null}
    />
  );
}
