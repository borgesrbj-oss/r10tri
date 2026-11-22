import { canAccessAthlete } from '@/lib/coach-access';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import {
  buildFit,
  buildTcx,
  buildTxt,
  buildZwo,
  dateStr,
  slugify,
  WorkoutExportError,
} from '@/lib/export-builders';
import {
  bikeThreshold,
  parsePaceSeconds,
  runThreshold,
} from '@/lib/training-zones';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FORMATS = {
  fit: 'application/octet-stream',
  tcx: 'application/vnd.garmin.tcx+xml; charset=utf-8',
  zwo: 'application/xml; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
} as const;

function failure(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return failure('Não autorizado', 401);

  const id = req.nextUrl.searchParams.get('id')?.trim();
  const format = (
    req.nextUrl.searchParams.get('format') || 'txt'
  ).toLowerCase();
  const mode = (req.nextUrl.searchParams.get('mode') || 'zona').toLowerCase();
  if (!id || id.length > 200)
    return failure('Informe um identificador de treino válido.', 400);
  if (!Object.prototype.hasOwnProperty.call(FORMATS, format))
    return failure('Formato inválido. Use fit, tcx, zwo ou txt.', 400);
  if (mode !== 'zona' && mode !== 'km')
    return failure('Modo inválido. Use zona ou km.', 400);

  const workout = await prisma.workout.findUnique({ where: { id } });
  if (!workout) return failure('Treino não encontrado', 404);
  if (!(await canAccessAthlete(session.user, workout.userId)))
    return failure('Sem permissão', 403);
  if (format === 'zwo' && !['corrida', 'ciclismo'].includes(workout.modality)) {
    return failure(
      'Para natação ou força, escolha FIT, TCX ou TXT. O formato ZWO é destinado a corrida e ciclismo.',
      422,
    );
  }

  const profile =
    format === 'fit' || format === 'zwo'
      ? await prisma.athleteProfile.findUnique({
          where: { userId: workout.userId },
        })
      : null;
  let content: string | Uint8Array;
  try {
    if (format === 'fit') {
      content = new Uint8Array(
        buildFit(workout, {
          mode,
          thresholdPaceSec:
            runThreshold(profile) ?? parsePaceSeconds(profile?.runPace),
        }),
      );
    } else if (format === 'tcx') content = buildTcx(workout);
    else if (format === 'zwo')
      content = buildZwo(workout, { ftp: bikeThreshold(profile) });
    else content = buildTxt(workout);
  } catch (error) {
    return failure(
      error instanceof WorkoutExportError
        ? error.message
        : 'Não foi possível exportar: a estrutura do treino precisa ser revisada pelo treinador.',
      422,
    );
  }

  const day = dateStr(workout);
  const title = slugify(workout.title || 'treino').slice(0, 100) || 'treino';
  const filename = `${day ? `${day}_` : ''}${title}${format === 'fit' && mode === 'km' ? '_km_estimado' : ''}.${format}`;
  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': FORMATS[format as keyof typeof FORMATS],
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
