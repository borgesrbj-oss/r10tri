import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { CalendarioClient } from './_components/calendario-client';
export default async function CalendarioPage() {
  const session = await auth();
  const userId = session?.user?.id ?? '';
  const workouts = await prisma.workout.findMany({ where: { userId }, orderBy: { date: 'asc' }, include: { log: true } });
  return <CalendarioClient workouts={JSON.parse(JSON.stringify(workouts ?? []))} />;
}
