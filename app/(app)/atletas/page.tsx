export const dynamic = 'force-dynamic';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { AtletasClient } from './_components/atletas-client';

export default async function AtletasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if ((session.user as any)?.role !== 'coach') redirect('/dashboard');

  const users = await prisma.user.findMany({
    where: { role: 'atleta' },
    include: {
      profile: true,
      targetRaces: { orderBy: { date: 'asc' }, take: 1 },
      _count: { select: { workoutLogs: true, trainingPlans: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const athletes = users.map((u) => ({
    id: u.id,
    name: u.name ?? 'Sem nome',
    email: u.email,
    photoUrl: u.profile?.photoUrl ?? null,
    hasPassword: !!u.password,
    level: u.profile?.level ?? null,
    modality: u.profile?.modality ?? null,
    currentWeight: u.profile?.currentWeight ?? null,
    nextRace: u.targetRaces?.[0]
      ? { name: u.targetRaces[0].name, date: u.targetRaces[0].date?.toISOString() ?? null }
      : null,
    logs: u._count.workoutLogs,
    plans: u._count.trainingPlans,
  }));

  return <AtletasClient athletes={athletes} />;
}
