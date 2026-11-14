export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { generateFallbackPlan, generateNutrition } from '@/lib/plan-engine';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  const role = (session.user as any).role;

  // Coach pode gerar plano para um atleta específico via targetUserId
  let targetUserId: string | undefined;
  let chosenModality: string | undefined;
  let runStructure: string | undefined;
  let startDate: string | undefined;
  let weeks: number | undefined;
  try { const b = await req.json(); targetUserId = b?.targetUserId; chosenModality = b?.modality; runStructure = b?.structure; startDate = b?.startDate; weeks = b?.weeks != null ? Number(b.weeks) : undefined; } catch {}
  const userId = (role === 'coach' && targetUserId) ? String(targetUserId) : session.user.id;

  let profile = await prisma.athleteProfile.findUnique({ where: { userId } });
  // Modalidade/estrutura escolhida na geração: persiste para manter zonas/filtros/visualização consistentes.
  // Resiliente: se a persistência falhar, a geração continua normalmente com o perfil atual.
  const validRunStructure = runStructure && ['zona', 'distancia'].includes(runStructure) ? runStructure : undefined;
  try {
    if (chosenModality && ['triatlo', 'natacao', 'ciclismo', 'corrida'].includes(chosenModality)) {
      profile = await prisma.athleteProfile.upsert({
        where: { userId },
        update: { modality: chosenModality, ...(validRunStructure ? { runStructure: validRunStructure } : {}) },
        create: { userId, modality: chosenModality, ...(validRunStructure ? { runStructure: validRunStructure } : {}) },
      });
    } else if (validRunStructure) {
      profile = await prisma.athleteProfile.upsert({
        where: { userId },
        update: { runStructure: validRunStructure },
        create: { userId, runStructure: validRunStructure },
      });
    }
  } catch { /* mantém o profile atual; a geração continua */ }

  const races = await prisma.targetRace.findMany({ where: { userId, date: { gte: new Date() } }, orderBy: { date: 'asc' } });

  // ===== GERAÇÃO 100% GRATUITA =====
  // Usa o motor determinístico do próprio app (periodização completa base → construção → pico →
  // polimento, distribuição polarizada, progressão 3:1, força/mobilidade e taper), SEM chamar nenhuma
  // IA paga — portanto NÃO consome créditos do usuário.
  const workoutsData = generateFallbackPlan(profile, races ?? [], profile?.availableDays ?? [], startDate, weeks);
  const nutritionText = generateNutrition(profile);
  const generatedBy = 'app';

  const planStart = workoutsData.length > 0 ? new Date(workoutsData[0].date) : new Date();
  const planEnd = workoutsData.length > 0 ? new Date(workoutsData[workoutsData.length - 1].date) : new Date();

  // Arquiva planos ativos anteriores
  await prisma.trainingPlan.updateMany({ where: { userId, status: 'active' }, data: { status: 'archived' } });

  const plan = await prisma.trainingPlan.create({
    data: {
      userId,
      name: `Plano ${races?.[0]?.name ?? 'Geral'} - ${new Date().toLocaleDateString('pt-BR')}`,
      startDate: planStart,
      endDate: planEnd,
      raceId: races?.[0]?.id ?? null,
      generatedBy,
      nutritionPlan: nutritionText,
    },
  });

  // Insere todos os treinos de uma vez (rápido e seguro para o timeout do banco)
  await prisma.workout.createMany({
    data: workoutsData.map((w) => ({
      userId,
      planId: plan.id,
      date: new Date(w.date),
      modality: w.modality,
      title: w.title,
      description: w.description ?? '',
      duration: w.duration ?? 60,
      targetZone: w.targetZone,
      tssEstimate: w.tssEstimate ? Number(w.tssEstimate) : null,
      phase: w.phase,
      weekNumber: w.weekNumber ? Number(w.weekNumber) : null,
    })),
  });

  return NextResponse.json({ planId: plan.id, workoutsCount: workoutsData.length, generatedBy });
}
