import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { ProvasClient } from './_components/provas-client';
import { getTriathlonRaceTarget } from '@/lib/triathlon-race';

export default async function ProvasPage() {
  const session = await auth();
  const userId = session?.user?.id ?? '';
  const [races, profile] = await Promise.all([
    prisma.targetRace.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
    prisma.athleteProfile.findUnique({ where: { userId }, select: {
      level: true, goalTime: true, ftp: true, testFTPEstimated: true, swimCssPace: true,
      testCSSPace: true, testCSS400: true, testCSS200: true, runThresholdPace: true, testRunPace: true,
    } }),
  ]);
  return <ProvasClient races={races.map(({ segmentTargets, ...race }) => ({
    ...race,
    date: race.date.toISOString(),
    raceTarget: getTriathlonRaceTarget({ ...race, segmentTargets }, profile),
  }))} />;
}
