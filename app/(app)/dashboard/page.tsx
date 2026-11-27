import { publicProfile } from '@/lib/profile-public';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { DashboardClient } from './_components/dashboard-client';
import { calendarDayInBrazil, currentTrainingWeek, visibleCalendarWorkouts, weeklyTrainingOverview } from '@/lib/weekly-training-overview';

export default async function DashboardPage() {
  const session = await auth();
  if (session?.user?.role === 'coach') redirect('/coach');
  const userId = session?.user?.id ?? '';
  const profile = await prisma.athleteProfile.findUnique({ where: { userId } });
  // Primeiro acesso do atleta: abrir o perfil para incluir data de nascimento, sexo, etc.
  if (
    userId &&
    (session?.user as any)?.role !== 'coach' &&
    (!profile || !profile.profileCompleted)
  ) {
    redirect('/perfil');
  }
  const races = await prisma.targetRace.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  });
  const sessionScope = { userId, NOT: { modality: 'descanso', duration: 0 } };
  const recentWorkouts = await prisma.workout.findMany({
    where: { ...sessionScope, ...visibleCalendarWorkouts },
    orderBy: { date: 'desc' },
    take: 10,
  });
  const totalWorkouts = await prisma.workout.count({ where: sessionScope });
  const completedWorkouts = await prisma.workout.count({
    where: { ...sessionScope, completed: true },
  });
  const localDay = calendarDayInBrazil(new Date());
  const today = new Date(localDay + 'T00:00:00Z');
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);
  const { start, end } = currentTrainingWeek(localDay);
  const activeScope = {
    ...sessionScope,
    paused: false,
    OR: [{ planId: null }, { plan: { status: 'active' } }],
  };
  const overviewSelect = {
    id: true, title: true, date: true, duration: true, structure: true,
    description: true, phase: true, modality: true, completed: true,
  } as const;
  const overviewOrder = [{ date: 'asc' }, { partOrder: 'asc' }, { id: 'asc' }] as const;
  const [todayWorkouts, next, week] = await Promise.all([
    prisma.workout.findMany({
      where: { ...activeScope, date: { gte: today, lt: tomorrow } },
      orderBy: [...overviewOrder],
      select: overviewSelect,
    }),
    prisma.workout.findFirst({
      where: { ...activeScope, date: { gte: tomorrow }, completed: false },
      orderBy: [...overviewOrder],
      select: overviewSelect,
    }),
    prisma.workout.findMany({
      where: { ...sessionScope, ...visibleCalendarWorkouts, date: { gte: start, lt: end } },
      select: {
        modality: true, duration: true, completed: true, paused: true,
        plan: { select: { status: true } }, log: { select: { actualDuration: true } },
      },
    }),
  ]);
  const upcomingRaces =
    races?.filter((r: any) => new Date(r?.date) > new Date()) ?? [];
  const coachMessages = userId
    ? await prisma.coachMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    : [];

  const serialized = {
    profile: profile
      ? JSON.parse(JSON.stringify(publicProfile(profile)))
      : null,
    today: localDay,
    todayWorkouts: JSON.parse(JSON.stringify(todayWorkouts)),
    next: next ? JSON.parse(JSON.stringify(next)) : null,
    week: weeklyTrainingOverview(week),
    races: JSON.parse(JSON.stringify(races ?? [])),
    recentWorkouts: JSON.parse(JSON.stringify(recentWorkouts ?? [])),
    totalWorkouts: totalWorkouts ?? 0,
    completedWorkouts: completedWorkouts ?? 0,
    upcomingRaces: JSON.parse(JSON.stringify(upcomingRaces ?? [])),
    userName: session?.user?.name ?? 'Atleta',
    isCoach: (session?.user as any)?.role === 'coach',
    coachMessages: JSON.parse(JSON.stringify(coachMessages ?? [])),
  };

  return <DashboardClient data={serialized} />;
}
