import { refreshFutureBikeTargets } from '@/lib/workout-reassessment';
import { publicProfile } from '@/lib/profile-public';
import { assessmentData } from '@/lib/assessment-validation';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  const profile = await prisma.athleteProfile.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json(publicProfile(profile));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  const raw = await req.json().catch(() => null);
  const previous = await prisma.athleteProfile.findUnique({ where: { userId: session.user.id } });
  const validated = assessmentData(raw, previous);
  if (!validated.ok) return NextResponse.json({ error: 'Confira os dados do perfil.', details: validated.errors }, { status: 422 });
  // Campos da triagem entram somente pelo resultado validado. Os demais
  // pertencem ao formulário legado e mantêm seu comportamento existente.
  const data = {
    ...validated.data,
    sex: raw.sex,
    nickname: raw.nickname,
    photoUrl: raw.photoUrl,
    daySchedule: raw.daySchedule,
    bikeEnvByDay: raw.bikeEnvByDay,
    runEnvByDay: raw.runEnvByDay,
    whatsapp: raw.whatsapp,
    runStructure: raw.runStructure,
    dashboardPrefs: raw.dashboardPrefs,
    aboutMe: raw.aboutMe,
  };
  const profile = await prisma.$transaction(async tx=>{const saved=await tx.athleteProfile.upsert({
    where: { userId: session.user.id },
    update: {
      ...validated.data,
      currentWeight: data.currentWeight,
      targetWeight: data.targetWeight,
      level: data.level,
      ...(data.availableDays !== undefined ? { availableDays: data.availableDays } : {}),
      limitations: data.limitations,
      ftp: data.ftp,
      vo2max: data.vo2max,
      swimPace: data.swimPace,
      runPace: data.runPace,
      raceHistory: data.raceHistory,
      profileCompleted: true,
      ...(data.birthDate !== undefined ? { birthDate: data.birthDate ? new Date(data.birthDate) : null } : {}),
      ...(data.sex !== undefined ? { sex: data.sex || null } : {}),
      ...(data.nickname !== undefined ? { nickname: data.nickname } : {}),
      ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl } : {}),
      ...(data.daySchedule !== undefined ? { daySchedule: data.daySchedule } : {}),
      ...(data.bikeEnvByDay !== undefined ? { bikeEnvByDay: data.bikeEnvByDay } : {}),
      ...(data.runEnvByDay !== undefined ? { runEnvByDay: data.runEnvByDay } : {}),
      ...(data.weeklyHours !== undefined ? { weeklyHours: data.weeklyHours } : {}),
      ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp || null } : {}),
      ...(data.runStructure !== undefined ? { runStructure: data.runStructure || null } : {}),
      ...(data.dashboardPrefs !== undefined ? { dashboardPrefs: data.dashboardPrefs || null } : {}),
      ...(data.aboutMe !== undefined ? { aboutMe: data.aboutMe || null } : {}),
    },
    create: {
      ...validated.data,
      userId: session.user.id,
      currentWeight: data.currentWeight,
      targetWeight: data.targetWeight,
      level: data.level ?? 'intermediario',
      availableDays: data.availableDays ?? [],
      limitations: data.limitations,
      ftp: data.ftp,
      vo2max: data.vo2max,
      swimPace: data.swimPace,
      runPace: data.runPace,
      raceHistory: data.raceHistory,
      profileCompleted: true,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      sex: data.sex || null,
      nickname: data.nickname ?? null,
      photoUrl: data.photoUrl ?? null,
      daySchedule: data.daySchedule ?? null,
      bikeEnvByDay: data.bikeEnvByDay ?? null,
      runEnvByDay: data.runEnvByDay ?? null,
      weeklyHours: data.weeklyHours ?? null,
      whatsapp: data.whatsapp || null,
      runStructure: data.runStructure || null,
      dashboardPrefs: data.dashboardPrefs || null,
      aboutMe: data.aboutMe || null,
    },
  });
  await refreshFutureBikeTargets(tx,session.user.id,previous,saved);return saved;},{timeout:20000});
  return NextResponse.json(publicProfile(profile));
}
