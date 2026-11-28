import {preparationIssues, thresholdMinutes, type ThresholdMinutes} from '@/lib/training-audit';
import { assessmentIssue } from '@/lib/assessment-review';
import { canAccessAthlete } from '@/lib/coach-access';
import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { generateNutrition } from '@/lib/plan-engine';
import { calendarDay, generateStructuredPlan } from '@/lib/training-structure';
import { assessmentReadiness } from '@/lib/assessment-validation';
import { trainingFeedback } from '@/lib/training-feedback';
import { TRAINING_GOALS } from '@/lib/training-goals';

export const dynamic = 'force-dynamic';
const options = { headers: { 'Cache-Control': 'no-store' } };
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401, ...options },
    );
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return NextResponse.json(
      { error: 'Envie os dados do plano em JSON.' },
      { status: 400, ...options },
    );
  const isCoach = session.user.role === 'coach';
  if (body.targetUserId && body.targetUserId !== session.user.id && !isCoach)
    return NextResponse.json(
      { error: 'Sem permissão para gerar o plano de outro atleta.' },
      { status: 403, ...options },
    );
  const userId =
    isCoach && typeof body.targetUserId === 'string'
      ? body.targetUserId
      : session.user.id;
  if (userId !== session.user.id) {
    if (!(await canAccessAthlete(session.user, userId)))
      return Response.json(
        { error: 'Vínculo ativo não encontrado.' },
        { status: 404 },
      );
    return Response.json(
      { error: 'Crie uma proposta na Área do Coach e publique após revisar.' },
      { status: 409 },
    );
  }
  if (
    await prisma.workout.count({
      where: {
        userId,
        coachManaged: true,
        completed: false,
        date: { gte: new Date(new Date().toISOString().slice(0, 10)) },
        OR: [{ planId: null }, { plan: { status: 'active' } }],
      },
    })
  )
    return Response.json(
      {
        error:
          'Existem sessões publicadas pelo coach. Solicite uma proposta revisada na Área do Coach; o plano atual foi preservado.',
      },
      { status: 409 },
    );
  const profile = await prisma.athleteProfile.findUnique({ where: { userId } });
  const modality = body.modality ?? profile?.modality;
  if (!['triatlo', 'natacao', 'ciclismo', 'corrida'].includes(modality))
    return NextResponse.json(
      { error: 'Escolha uma modalidade válida.', ...(body.modality===undefined?{assessmentIssues:[assessmentIssue('modality','Selecione sua modalidade na triagem.')]}:{}) },
      { status: 422, ...options },
    );
  if (
    body.goal !== undefined &&
    (typeof body.goal !== 'string' ||
      !Object.prototype.hasOwnProperty.call(
        TRAINING_GOALS[modality] ?? {},
        body.goal,
      ))
  )
    return NextResponse.json(
      { error: 'Escolha um objetivo compatível com a modalidade.' },
      { status: 422, ...options },
    );
  if (
    body.structure !== undefined &&
    !['zona', 'distancia'].includes(body.structure)
  )
    return NextResponse.json(
      { error: 'Escolha estrutura por FC ou distância.' },
      { status: 422, ...options },
    );
  const selected = {
    ...profile,
    modality,
    trainingGoal:
      body.goal ??
      (modality === profile?.modality ? profile?.trainingGoal : null) ??
      null,
    runStructure: body.structure ?? profile?.runStructure,
  };
  const readiness = assessmentReadiness(selected);
  if (!readiness.complete)
    return NextResponse.json(
      {
        error: `Complete a triagem antes de gerar: ${readiness.missing.join(', ')}.`,
        missing: readiness.missing,
        assessmentIssues: readiness.issues,
      },
      { status: 422, ...options },
    );
  const weeks = body.weeks === undefined ? undefined : Number(body.weeks);
  if (
    weeks !== undefined &&
    (!Number.isInteger(weeks) || weeks < 1 || weeks > 52)
  )
    return NextResponse.json(
      { error: 'Escolha um plano de 1 a 52 semanas.' },
      { status: 422, ...options },
    );
  if (
    body.startDate !== undefined &&
    (typeof body.startDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.startDate) ||
      !calendarDay(body.startDate))
  )
    return NextResponse.json(
      { error: 'Informe uma data de início válida.' },
      { status: 422, ...options },
    );
  const races = await prisma.targetRace.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  });
  const specificIssues=preparationIssues(selected,races,body.startDate??new Date());
  if(specificIssues.length)return NextResponse.json({error:'Revise os dados da triagem para esta modalidade.',assessmentIssues:specificIssues},{status:422,...options});
  const now = new Date();
  const [logs, past] = await Promise.all([
    prisma.workoutLog.findMany({
      where: {
        userId,
        completedAt: { gte: new Date(now.getTime() - 7 * 86400000) },
      },
      select: {
        completedAt: true,
        actualDuration: true,
        rpe: true,
        sleepHours: true,
        fatigueScore: true,
        painScore: true,
      },
      take: 50,
      orderBy: { completedAt: 'desc' },
    }),
    prisma.workout.findMany({
      where: {
        userId,
        paused: false,
        date: { gte: new Date(now.getTime() - 7 * 86400000), lt: now },
        OR: [{ planId: null }, { plan: { status: 'active' } }],
      },
      select: { date: true, completed: true },
      take: 50,
    }),
  ]);
  const feedback = trainingFeedback(logs, past, now);
  const generated = generateStructuredPlan(
    selected,
    races,
    profile!.availableDays,
    body.startDate,
    weeks,
    feedback,
  );
  generated.summary.feedback = {
    status: feedback.status,
    reasons: feedback.reasons,
    observedSessions: feedback.observedSessions,
  };
  if (generated.summary.assessmentIssues?.length) {
    return NextResponse.json({
      error: generated.summary.assessmentIssues[0].message,
      warnings: generated.warnings,
      assessmentIssues: generated.summary.assessmentIssues,
    }, { status: 422, ...options });
  }
  if (!generated.workouts.length && generated.summary.requiresCoachReview) {
    const review = generated.warnings.find(warning => warning.startsWith('Prescrição pendente'));
    if (review) return NextResponse.json({ error: review, warnings: generated.warnings }, { status: 422, ...options });
  }
  if (!generated.workouts.length)
    return NextResponse.json(
      {
        error: 'Não foi possível gerar sessões com essa disponibilidade.',
        warnings: generated.warnings,
        assessmentIssues: ['weeklyHours','availableDays',...Object.keys(profile?.dailyMinutes && typeof profile.dailyMinutes==='object'?profile.dailyMinutes:{}).map(day=>'dailyMinutes.'+day)].map(field=>assessmentIssue(field,'Revise a disponibilidade: os limites atuais não permitem encaixar sessões.')),
      },
      { status: 422, ...options },
    );
  const workouts = generated.workouts;
  if (body.preview === true || typeof body.previewToken === 'string') {
    const token = createHash('sha256')
      .update(JSON.stringify({ userId, profileUpdatedAt: profile?.updatedAt, generated }))
      .digest('hex');
    if (body.preview === true) {
      const bySport = new Map<string, { modality: string; minutes: number; sessions: number }>();
      for (const workout of workouts) {
        const count = bySport.get(workout.modality) ?? { modality: workout.modality, minutes: 0, sessions: 0 };
        count.minutes += workout.duration;
        count.sessions++;
        bySport.set(workout.modality, count);
      }
      const firstWeek = workouts.filter(workout => workout.weekNumber === 1).map(workout => ({
        date: workout.date, title: workout.title, duration: workout.duration, zone: workout.targetZone,
      }));
      const marathon = generated.summary.goal === '42k' && modality === 'corrida';
      const runningIntensity = marathon ? workouts.reduce<ThresholdMinutes>((total, workout) => {
        if (workout.modality !== 'corrida') return total;
        const minutes = thresholdMinutes(workout.structure);
        return { total: total.total + minutes.total, below: total.below + minutes.below, at: total.at + minutes.at, above: total.above + minutes.above, unknown: total.unknown + minutes.unknown };
      }, { total: 0, below: 0, at: 0, above: 0, unknown: 0 }) : undefined;
      const qualityExamples = marathon ? ['Tiros', 'Fartlek', 'Ritmo sustentado'].flatMap(label => {
        const session = workouts.find(workout => workout.modality === 'corrida' && workout.title.startsWith(label));
        return session ? [{ title: label, date: session.date, week: session.weekNumber }] : [];
      }) : [];
      return NextResponse.json({
        previewToken: token,
        goal: generated.summary.goal,
        weeks: generated.summary.weeks.length,
        workoutsCount: workouts.length,
        sports: [...bySport.values()],
        firstWeek,
        highMinutes: generated.summary.distribution.highSeconds / 60,
        runningIntensity,
        qualityExamples,
        warnings: generated.warnings,
      }, options);
    }
    if (token !== body.previewToken) {
      return NextResponse.json({ error: 'A triagem ou o calendário mudou. Gere outra prévia para confirmar a versão atual.' }, { status: 409, ...options });
    }
  }
  const plan = await prisma.$transaction(
    async (tx) => {
      // Só arquiva o plano anterior após validar o novo; todas as gravações são atômicas.
      await tx.trainingPlan.updateMany({
        where: { userId, status: 'active' },
        data: { status: 'archived' },
      });
      const created = await tx.trainingPlan.create({
        data: {
          userId,
          name: `Plano ${modality} — ${new Date(workouts[0].date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`,
          startDate: new Date(workouts[0].date),
          endDate: new Date(workouts[workouts.length - 1].date),
          raceId: generated.summary.raceId ?? null,
          generatedBy: 'app-estruturado',
          nutritionPlan: generateNutrition(selected),
          summary: JSON.parse(
            JSON.stringify(generated.summary),
          ) as Prisma.InputJsonValue,
        },
      });
      await tx.workout.createMany({
        data: workouts.map((workout) => ({
          userId,
          planId: created.id,
          date: new Date(workout.date),
          modality: workout.modality,
          title: workout.title,
          description: workout.description,
          duration: workout.duration,
          targetZone: workout.targetZone,
          tssEstimate: workout.tssEstimate,
          phase: workout.phase,
          weekNumber: workout.weekNumber,
          brickGroupId: workout.brickGroupKey ? created.id + ':' + workout.brickGroupKey : null,
          partOrder: workout.partOrder ?? 0,
          structure: JSON.parse(
            JSON.stringify(workout.structure),
          ) as Prisma.InputJsonValue,
        })),
      });
      await tx.athleteProfile.update({
        where: { userId },
        data: {
          modality,
          trainingGoal: generated.summary.goal,
          ...(['zona', 'distancia'].includes(body.structure)
            ? { runStructure: body.structure }
            : {}),
        },
      });
      return created;
    },
    { timeout: 20000 },
  );
  return NextResponse.json(
    {
      planId: plan.id,
      workoutsCount: workouts.length,
      generatedBy: 'app-estruturado',
      warnings: generated.warnings,
      summary: generated.summary,
    },
    options,
  );
}
