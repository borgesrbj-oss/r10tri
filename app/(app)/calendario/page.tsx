import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { calendarDay } from '@/lib/calendar-day';
import { calendarDayInBrazil, visibleCalendarWorkouts } from '@/lib/weekly-training-overview';
import { CalendarioClient } from './_components/calendario-client';

export default async function CalendarioPage({ searchParams }: {
  searchParams: Promise<{ data?: string | string[]; visao?: string | string[] }>;
}) {
  const session = await auth();
  const userId = session?.user?.id ?? '';
  const { data, visao } = await searchParams;
  const anchor = typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data) && calendarDay(data)
    ? data : calendarDayInBrazil(new Date());
  const view = visao === 'dia' || visao === 'mes' || visao === 'todos' ? visao : 'semana';
  const workouts = await prisma.workout.findMany({
    where: { userId, ...visibleCalendarWorkouts },
    orderBy: [{ date: 'asc' }, { partOrder: 'asc' }, { id: 'asc' }],
    include: { log: true },
  });
  return <CalendarioClient key={anchor + view} initialAnchor={anchor} initialView={view} workouts={JSON.parse(JSON.stringify(workouts))} />;
}
