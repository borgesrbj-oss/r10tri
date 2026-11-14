import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { ProvasClient } from './_components/provas-client';

export default async function ProvasPage() {
  const session = await auth();
  const userId = session?.user?.id ?? '';
  const races = await prisma.targetRace.findMany({ where: { userId }, orderBy: { date: 'asc' } });
  return <ProvasClient races={JSON.parse(JSON.stringify(races ?? []))} />;
}
