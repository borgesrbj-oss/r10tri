export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  const userId = session.user.id;
  
  const workouts = await prisma.workout.findMany({ where: { userId }, orderBy: { date: 'asc' }, include: { log: true } });
  const weightLogs = await prisma.weightLog.findMany({ where: { userId }, orderBy: { date: 'asc' } });
  const races = await prisma.targetRace.findMany({ where: { userId }, orderBy: { date: 'asc' } });
  const profile = await prisma.athleteProfile.findUnique({ where: { userId } });

  const weeklyLoad: any[] = [];
  const byWeek = new Map<string, { natacao: number; ciclismo: number; corrida: number; total: number }>();
  for (const w of workouts ?? []) {
    const d = new Date(w.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    if (!byWeek.has(key)) byWeek.set(key, { natacao: 0, ciclismo: 0, corrida: 0, total: 0 });
    const wk = byWeek.get(key)!;
    const dur = w.duration ?? 0;
    if (w.modality === 'natacao') wk.natacao += dur;
    else if (w.modality === 'ciclismo') wk.ciclismo += dur;
    else if (w.modality === 'corrida') wk.corrida += dur;
    wk.total += dur;
  }
  for (const [week, data] of byWeek) {
    weeklyLoad.push({ week, ...data });
  }

  const total = workouts?.length ?? 0;
  const done = workouts?.filter((w: any) => w?.completed)?.length ?? 0;

  return NextResponse.json({
    weeklyLoad,
    weightLogs: (weightLogs ?? []).map((l: any) => ({ date: l?.date, weight: l?.weight })),
    compliance: { total, done, rate: total > 0 ? Math.round((done / total) * 100) : 0 },
    races: (races ?? []).map((r: any) => ({ name: r?.name, date: r?.date, distance: r?.distance })),
    profile: profile ? { currentWeight: profile.currentWeight, targetWeight: profile.targetWeight } : null,
  });
}
