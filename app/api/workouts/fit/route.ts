import { canAccessAthlete } from '@/lib/coach-access';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { buildFit, slugify } from '@/lib/export-builders';
import { paceToSec } from '@/lib/plan-engine';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id)
    return NextResponse.json({ error: 'id obrigatório' }, { status: 400 });

  const workout = await prisma.workout.findUnique({ where: { id } });
  if (!workout)
    return NextResponse.json(
      { error: 'Treino não encontrado' },
      { status: 404 },
    );

  if (!(await canAccessAthlete(session.user, workout.userId))) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  // Modo de exportação: 'zona' (alvo por zona de FC, por tempo) ou 'km' (por distância).
  const mode =
    (req.nextUrl.searchParams.get('mode') || 'zona').toLowerCase() === 'km'
      ? 'km'
      : 'zona';
  // Pace de limiar do atleta (para converter tempo->distância na corrida).
  const profile = await prisma.athleteProfile.findUnique({
    where: { userId: workout.userId },
  });
  const thresholdPaceSec = paceToSec(profile?.testRunPace || profile?.runPace);

  const buffer = buildFit(workout, { mode, thresholdPaceSec });
  const ds = workout.date
    ? new Date(workout.date).toISOString().slice(0, 10)
    : null;
  const filename =
    (ds ? ds + '_' : '') +
    slugify(workout.title) +
    (mode === 'km' ? '_km' : '_fc') +
    '.fit';

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
