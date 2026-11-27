export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { athleteRaceTargetsSchema, configuredRaceTargets, getTriathlonFormat } from '@/lib/triathlon-race';

const options = { headers: { 'Cache-Control': 'no-store' } };
const raceSchema = z.object({
  id: z.string().trim().min(1).max(128).optional(),
  name: z.string().trim().min(1, 'Informe o nome da prova.').max(200),
  date: z.string().trim().max(50).pipe(z.union([z.iso.date(), z.iso.datetime({ offset: true })]))
    .refine(value => Number(value.slice(0, 4)) >= 1, 'Informe uma data válida.')
    .transform(value => new Date(value.length === 10 ? `${value}T12:00:00Z` : value)),
  // Distâncias personalizadas já aceitas pelo app continuam disponíveis.
  distance: z.string().trim().min(1, 'Informe a distância da prova.').max(100),
  notes: z.string().trim().max(4000).nullable().optional(),
  priority:z.enum(['A','B','C']).nullable().optional(),
  segmentTargets: athleteRaceTargetsSchema.optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401, ...options });
  const races = await prisma.targetRace.findMany({ where: { userId: session.user.id }, orderBy: { date: 'asc' } });
  return NextResponse.json(races, options);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401, ...options });
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Envie um corpo JSON válido.' }, { status: 400, ...options }); }
  const parsed = raceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Confira os dados da prova.', details: parsed.error.issues.map(issue => ({ field: issue.path.join('.'), message: /^(Invalid|Too |Expected)/.test(issue.message) ? 'Valor inválido. Confira o campo informado.' : issue.message })) }, { status: 422, ...options });
  const { id, segmentTargets, ...data } = parsed.data;
  const format = getTriathlonFormat(data);
  if (segmentTargets && !format) return NextResponse.json({ error: 'A meta por segmentos exige formato sprint, olímpico, 70.3 ou Ironman.' }, { status: 422, ...options });
  const userId = session.user.id;
  if (id) {
    try {
      // A condição de propriedade faz parte da própria gravação, sem janela
      // entre consultar a autorização e atualizar o registro.
      const where = { id, userId };
      const race = format ? await prisma.$transaction(async tx => {
        const previous = await tx.targetRace.findFirst({ where });
        if (!previous) return null;
        const config = configuredRaceTargets(previous);
        const sameEvent = config?.format === format && previous.name === data.name
          && previous.date.toISOString().slice(0, 10) === data.date.toISOString().slice(0, 10);
        if (!segmentTargets && !config) return tx.targetRace.update({ where, data });
        const goalSeconds = segmentTargets ? segmentTargets.goalSeconds ?? undefined : config?.goalSeconds;
        const next = sameEvent ? { ...config, goalSeconds } : { format, goalSeconds };
        return tx.targetRace.update({ where, data: { ...data, segmentTargets: { ...next, format } } });
      }, { isolationLevel: 'Serializable' }) : await prisma.targetRace.update({ where, data: { ...data, segmentTargets: Prisma.DbNull } });
      if (!race) return NextResponse.json({ error: 'Prova não encontrada.' }, { status: 404, ...options });
      return NextResponse.json(race, options);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') return NextResponse.json({ error: 'Prova não encontrada.' }, { status: 404, ...options });
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2034') return NextResponse.json({ error: 'A prova mudou durante a edição. Atualize a página e tente novamente.' }, { status: 409, ...options });
      return NextResponse.json({ error: 'Não foi possível salvar a prova agora. Tente novamente em instantes.' }, { status: 503, ...options });
    }
  }
  const goalSeconds = segmentTargets?.goalSeconds;
  const race = await prisma.targetRace.create({ data: { ...data, userId, ...(format && goalSeconds ? { segmentTargets: { format, goalSeconds } } : {}) } });
  return NextResponse.json(race, { status: 201, ...options });
}
