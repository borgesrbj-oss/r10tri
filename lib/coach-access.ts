import { prisma } from './db';
import type { Prisma } from '@prisma/client';

export type Actor = { id: string; role?: string | null; name?: string | null };
export class CoachError extends Error {
  constructor(
    message: string,
    public status = 403,
  ) {
    super(message);
  }
}
/** Usado também nas rotas legadas: nenhum papel de coach equivale a acesso global. */
export function athleteScope(actor: Actor): Prisma.UserWhereInput {
  return actor.role === 'coach'
    ? {
        OR: [
          { id: actor.id },
          {
            role: 'atleta',
            athleteLinks: { some: { coachId: actor.id, status: 'active' } },
          },
        ],
      }
    : { id: actor.id };
}
export async function canAccessAthlete(actor: Actor, athleteId: string) {
  return Boolean(
    await prisma.user.findFirst({
      where: { AND: [{ id: athleteId }, athleteScope(actor)] },
      select: { id: true },
    }),
  );
}
export async function activeLink(
  tx: Prisma.TransactionClient,
  actor: Actor,
  athleteId: string,
  lock = false,
) {
  if (actor.role !== 'coach' || actor.id === athleteId)
    throw new CoachError('Área exclusiva do coach autorizado.');
  const link = await tx.coachAthlete.findUnique({
    where: { coachId_athleteId: { coachId: actor.id, athleteId } },
  });
  if (!link || link.status !== 'active')
    throw new CoachError('Vínculo ativo não encontrado.', 404);
  if (lock) {
    const changed = await tx.coachAthlete.updateMany({
      where: { id: link.id, status: 'active' },
      data: { revision: { increment: 1 } },
    });
    if (changed.count !== 1)
      throw new CoachError('O vínculo foi encerrado. Atualize a página.', 409);
  }
  return link;
}
export function coachErrorResponse(error: unknown) {
  if (error instanceof CoachError)
    return Response.json({ error: error.message }, { status: error.status });
  if (
    typeof error === 'object' &&
    error &&
    'code' in error &&
    ['P2034', 'P2002'].includes(String(error.code))
  )
    return Response.json(
      {
        error:
          'Os dados mudaram durante esta operação. Atualize e revise antes de repetir.',
      },
      { status: 409 },
    );
  console.error('Falha na operação da área do coach.');
  return Response.json(
    { error: 'Não foi possível concluir a operação. Tente novamente.' },
    { status: 500 },
  );
}
