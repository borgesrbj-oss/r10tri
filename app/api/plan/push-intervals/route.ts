export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { describeWorkoutForExport, intervalsStartLocal, DEFAULT_WORKOUT_TIME } from '@/lib/export-builders';
import { readWorkoutStructure } from '@/lib/training-structure';

// Envia os treinos do plano DIRETO para o calendario do Intervals.icu, ja com data E horario (04:30),
// via a API gratuita do Intervals.icu (POST /events/bulk?upsert=true, Basic auth API_KEY:chave).
// Deterministico, sem IA/creditos. Usa external_id para nao duplicar em reenvios (upsert).

// Mapa de modalidade -> tipo de atividade do Intervals.icu.
const TYPE_MAP: Record<string, string> = {
  natacao: 'Swim',
  ciclismo: 'Ride',
  corrida: 'Run',
  forca: 'WeightTraining',
  descanso: 'Other',
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const planId = typeof body?.planId === 'string' ? body.planId : null;
  const modality = (typeof body?.modality === 'string' ? body.modality : 'todos').toLowerCase();
  if (!planId) return NextResponse.json({ error: 'planId obrigatorio' }, { status: 400 });

  const plan = await prisma.trainingPlan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: 'Plano nao encontrado' }, { status: 404 });

  const isCoach = (session.user as any).role === 'coach';
  if (plan.userId !== session.user.id && !isCoach) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
  }

  // A chave usada e a do DONO do plano (o atleta). Coach so consegue enviar se o atleta ja salvou a chave.
  const profile = await prisma.athleteProfile.findUnique({ where: { userId: plan.userId } });
  const apiKey = profile?.intervalsIcuApiKey?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: 'CHAVE_AUSENTE', message: 'Configure a chave de API do Intervals.icu no perfil do atleta antes de enviar.' }, { status: 400 });
  }

  const where: any = { planId };
  if (modality !== 'todos') where.modality = modality;
  const workouts = await prisma.workout.findMany({ where, orderBy: { date: 'asc' } });
  if (workouts.length === 0) return NextResponse.json({ error: 'Nenhum treino para enviar' }, { status: 404 });
  for (const workout of workouts) {
    const structure = readWorkoutStructure(workout.structure);
    if (workout.structure != null && (!structure || structure.modality !== workout.modality)) {
      return NextResponse.json({ error: 'ESTRUTURA_INVALIDA', message: 'Revise a estrutura dos treinos antes de enviar ao Intervals.icu.' }, { status: 422 });
    }
  }

  // Monta os eventos do calendario. start_date_local carrega a data + horario 04:30 (local).
  const events = workouts
    .map((w) => {
      const start = intervalsStartLocal(w, DEFAULT_WORKOUT_TIME);
      if (!start) return null;
      const type = TYPE_MAP[w.modality] ?? 'Other';
      const isRest = w.modality === 'descanso';
      const structure = readWorkoutStructure(w.structure);
      return {
        external_id: `r10tri_${w.id}`,
        start_date_local: start,
        category: isRest ? 'NOTE' : 'WORKOUT',
        type,
        name: w.title || 'Treino',
        description: describeWorkoutForExport(w),
        // duracao planejada em segundos (aparece como carga/tempo no calendario)
        ...(isRest ? {} : { moving_time: structure?.durationSeconds ?? (w.duration || 0) * 60 }),
      };
    })
    .filter(Boolean);

  // Chama a API do Intervals.icu. athlete/0 resolve para o dono da chave.
  const auth64 = Buffer.from(`API_KEY:${apiKey}`).toString('base64');
  let resp: Response;
  try {
    resp = await fetch('https://intervals.icu/api/v1/athlete/0/events/bulk?upsert=true', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth64}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(events),
    });
  } catch {
    return NextResponse.json({ error: 'FALHA_CONEXAO', message: 'Nao foi possivel conectar ao Intervals.icu.' }, { status: 502 });
  }

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    const status = resp.status;
    const msg = status === 401 || status === 403
      ? 'Chave de API invalida ou sem permissao. Gere uma nova em Settings > Developer no Intervals.icu.'
      : `O Intervals.icu recusou o envio (HTTP ${status}).`;
    return NextResponse.json({ error: 'RECUSADO', status, message: msg, detail: txt.slice(0, 300) }, { status: 502 });
  }

  return NextResponse.json({ ok: true, sent: events.length });
}
