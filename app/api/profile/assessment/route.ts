import { publicProfile } from '@/lib/profile-public';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const userId = session.user.id;
  const body = await req.json();

  const data: Record<string, any> = {
    // Step 1 - Experiência
    trainingYears: body.trainingYears != null ? Number(body.trainingYears) : undefined,
    level: body.level || undefined,
    modality: body.modality || undefined,
    previousPlanExp: body.previousPlanExp || undefined,
    raceHistory: body.raceHistory || undefined,
    // Step 2 - Nível por modalidade
    swimLevel: body.swimLevel || undefined,
    bikeLevel: body.bikeLevel || undefined,
    runLevel: body.runLevel || undefined,
    weakestSport: body.weakestSport || undefined,
    strongestSport: body.strongestSport || undefined,
    // Step 3 - Métricas
    currentWeight: body.currentWeight != null ? Number(body.currentWeight) : undefined,
    targetWeight: body.targetWeight != null ? Number(body.targetWeight) : undefined,
    ftp: body.ftp != null ? Number(body.ftp) : undefined,
    vo2max: body.vo2max != null ? Number(body.vo2max) : undefined,
    swimPace: body.swimPace || undefined,
    runPace: body.runPace || undefined,
    // Step 4 - Objetivos
    goalType: body.goalType || undefined,
    goalTime: body.goalTime || undefined,
    // Tests
    testCSS400: body.testCSS400 || undefined,
    testCSS200: body.testCSS200 || undefined,
    testCSSPace: body.testCSSPace || undefined,
    testFTP20min: body.testFTP20min != null && body.testFTP20min !== '' ? Number(body.testFTP20min) : undefined,
    testFTPEstimated: body.testFTPEstimated != null && body.testFTPEstimated !== '' ? Number(body.testFTPEstimated) : undefined,
    testFTPHR: body.testFTPHR != null && body.testFTPHR !== '' ? Number(body.testFTPHR) : undefined,
    testRun30min: body.testRun30min != null && body.testRun30min !== '' ? Number(body.testRun30min) : undefined,
    testRunPace: body.testRunPace || undefined,
    testRunHR: body.testRunHR != null && body.testRunHR !== '' ? Number(body.testRunHR) : undefined,
    testRun3km: body.testRun3km || undefined,
    canSwim: body.canSwim ?? undefined,
    testsCompleted: body.testsCompleted ?? undefined,
    // Step 5 - Saúde
    injuryHistory: body.injuryHistory || undefined,
    currentInjuries: body.currentInjuries || undefined,
    medicalConditions: body.medicalConditions || undefined,
    sleepHours: body.sleepHours != null ? Number(body.sleepHours) : undefined,
    stressLevel: body.stressLevel || undefined,
    dietaryNotes: body.dietaryNotes || undefined,
    // Step 6 - Logística
    weeklyHours: body.weeklyHours != null ? Number(body.weeklyHours) : undefined,
    currentWeeklyVol: body.currentWeeklyVol != null ? Number(body.currentWeeklyVol) : undefined,
    availableDays: body.availableDays || undefined,
    workSchedule: body.workSchedule || undefined,
    travelFrequency: body.travelFrequency || undefined,
    hasPoolAccess: body.hasPoolAccess ?? undefined,
    poolSize: body.poolSize || undefined,
    hasTrainer: body.hasTrainer ?? undefined,
    hasPowerMeter: body.hasPowerMeter ?? undefined,
    hasHRM: body.hasHRM ?? undefined,
    bikeType: body.bikeType || undefined,
    limitations: body.limitations || undefined,
    coachAssessmentDone: true,
  };

  // Remove undefined fields
  const cleanData: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) cleanData[k] = v;
  }

  await prisma.athleteProfile.upsert({
    where: { userId },
    update: cleanData,
    create: { userId, ...cleanData },
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const profile = await prisma.athleteProfile.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json(publicProfile(profile));
}
