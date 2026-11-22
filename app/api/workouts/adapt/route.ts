import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { editWorkoutStructure } from '@/lib/workout-edit';
import { describeStructure } from '@/lib/training-structure';
import { z } from 'zod';
export const dynamic = 'force-dynamic';
const schema = z.object({
  id: z.string().min(1),
  action: z.enum(['pausar', 'retomar', 'encurtar', 'substituir']),
  minutes: z.number().int().min(4).max(480).optional(),
  modality: z.enum(['corrida', 'ciclismo', 'natacao', 'forca']).optional(),
});
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Confira a ação e os valores.' },
      { status: 422 },
    );
  const { id, action, minutes, modality } = parsed.data;
  const workout = await prisma.workout.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!workout)
    return NextResponse.json(
      { error: 'Treino não encontrado' },
      { status: 404 },
    );
  if (workout.completed)
    return NextResponse.json(
      { error: 'Preserve o histórico: adapte somente sessões não concluídas.' },
      { status: 409 },
    );
  if (workout.completed || workout.coachManaged)
    return Response.json(
      {
        error:
          'Histórico realizado e prescrição publicada do coach são preservados. Solicite revisão na Área do Coach.',
      },
      { status: 409 },
    );
  const profile = await prisma.athleteProfile.findUnique({
    where: { userId: workout.userId },
  });
  if (action === 'pausar' || action === 'retomar') {
    await prisma.workout.update({
      where: { id, userId: workout.userId },
      data: { paused: action === 'pausar' },
    });
  } else {
    if (
      action === 'encurtar' &&
      (minutes == null || minutes >= workout.duration)
    )
      return NextResponse.json(
        {
          error: 'Informe duração menor que a atual, com pelo menos 4 minutos.',
        },
        { status: 422 },
      );
    if (action === 'substituir' && !modality)
      return NextResponse.json(
        { error: 'Escolha a modalidade.' },
        { status: 422 },
      );
    if (
      modality === 'natacao' &&
      (profile?.canSwim === false || profile?.hasPoolAccess === false)
    )
      return NextResponse.json(
        { error: 'Sem habilidade/acesso à água: não substituir por natação.' },
        { status: 422 },
      );
    try {
      const structure = editWorkoutStructure(
        workout.structure,
        minutes ?? workout.duration,
        modality ?? (workout.modality as any),
        null,
        profile,
      );
      await prisma.workout.update({
        where: { id, userId: workout.userId },
        data: {
          ...(action === 'substituir'
            ? {
                title:
                  'Sessão substituída · ' +
                  {
                    corrida: 'Corrida',
                    ciclismo: 'Ciclismo',
                    natacao: 'Natação',
                    forca: 'Força',
                  }[modality!],
              }
            : {}),
          duration: minutes ?? workout.duration,
          modality: modality ?? workout.modality,
          targetZone:
            structure.steps
              .filter((step) => step.kind === 'principal' && step.zone)
              .sort(
                (a, b) => Number(b.zone!.slice(1)) - Number(a.zone!.slice(1)),
              )[0]?.zone || 'Z1',
          structure: JSON.parse(JSON.stringify(structure)),
          description:
            describeStructure(structure) +
            '\n\nRegistro anterior preservado como referência:\n' +
            (workout.description || ''),
          tssEstimate: null,
        },
      });
    } catch {
      return NextResponse.json(
        {
          error:
            'Sessão sem estrutura válida: peça ao coach para revisar os blocos.',
        },
        { status: 422 },
      );
    }
  }
  return NextResponse.json({
    ok: true,
    message:
      'Sessão adaptada. Reavalie os alertas da semana e a recuperação; nenhuma falta foi acumulada.',
  });
}
