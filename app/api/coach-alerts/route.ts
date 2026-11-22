import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import {
  buildCoachAlerts,
  COACH_ALERT_ATHLETE_LIMIT,
  coachAlertWindow,
} from '@/lib/coach-alerts';

export const dynamic = 'force-dynamic';
const options = { headers: { 'Cache-Control': 'no-store' } };

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json(
      { error: 'Entre novamente para consultar os alertas.' },
      { status: 401, ...options },
    );
  if (session.user.role !== 'coach')
    return NextResponse.json(
      { error: 'Este painel está disponível apenas para treinadores.' },
      { status: 403, ...options },
    );
  try {
    const now = new Date();
    const window = coachAlertWindow(now);
    const [athletes, totalAthletes] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: 'atleta',
          athleteLinks: {
            some: { coachId: session.user.id, status: 'active' },
          },
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: COACH_ALERT_ATHLETE_LIMIT,
        select: {
          id: true,
          name: true,
          createdAt: true,
          profile: {
            select: {
              birthDate: true,
              currentWeight: true,
              level: true,
              weeklyHours: true,
              availableDays: true,
              modality: true,
            },
          },
          workoutLogs: {
            orderBy: { completedAt: 'desc' },
            take: 1,
            select: {
              completedAt: true,
              painScore: true,
              fatigueScore: true,
              sleepHours: true,
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          role: 'atleta',
          athleteLinks: {
            some: { coachId: session.user.id, status: 'active' },
          },
        },
      }),
    ]);
    const ids = athletes.map((athlete) => athlete.id);
    const activeWorkouts = {
      paused: false,
      userId: { in: ids },
      OR: [{ planId: null }, { plan: { status: 'active' } }],
    };
    const [overdue, weekly] = ids.length
      ? await Promise.all([
          prisma.workout.groupBy({
            by: ['userId'],
            where: {
              ...activeWorkouts,
              date: { gte: window.overdueSince, lt: window.today },
              completed: false,
              modality: { not: 'descanso' },
            },
            _count: { _all: true },
          }),
          prisma.workout.groupBy({
            by: ['userId'],
            where: {
              ...activeWorkouts,
              date: { gte: window.weekStart, lt: window.weekEnd },
              duration: { gt: 0 },
              modality: { not: 'descanso' },
            },
            _sum: { duration: true },
          }),
        ])
      : [[], []];
    const overdueByUser = new Map(
      overdue.map((row) => [row.userId, row._count._all]),
    );
    const weeklyByUser = new Map(
      weekly.map((row) => [row.userId, row._sum.duration || 0]),
    );
    const report = buildCoachAlerts(
      athletes.map((athlete) => ({
        id: athlete.id,
        name: athlete.name,
        createdAt: athlete.createdAt,
        profile: athlete.profile,
        latestLog: athlete.workoutLogs[0] || null,
        overdueWorkouts: overdueByUser.get(athlete.id) || 0,
        weeklyPlannedMinutes: weeklyByUser.get(athlete.id) || 0,
      })),
      now,
    );
    return NextResponse.json(
      {
        ...report,
        limited: totalAthletes > COACH_ALERT_ATHLETE_LIMIT,
        totalAthletes,
      },
      options,
    );
  } catch {
    return NextResponse.json(
      {
        error:
          'Não foi possível carregar os alertas. Tente novamente em instantes.',
      },
      { status: 503, ...options },
    );
  }
}
