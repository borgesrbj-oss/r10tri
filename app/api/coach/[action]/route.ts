import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { coachErrorResponse, CoachError, type Actor } from '@/lib/coach-access';
import * as service from '@/lib/coach-service';
import { z } from 'zod';
export const dynamic = 'force-dynamic';
export async function GET(
  req: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new CoachError('Não autorizado', 401);
    const actor = session.user;
    const { action } = await params;
    let result: unknown;
    if (action === 'invitations') {
      result = await prisma.coachAthlete.findMany({
        where: { athleteId: actor.id, status: 'pending' },
        select: {
          id: true,
          createdAt: true,
          coach: { select: { name: true } },
        },
      });
    } else if (action === 'publications') {
      result = await prisma.coachPublication.findMany({
        where: { link: { athleteId: actor.id } },
        select: {
          id: true,
          authorName: true,
          instructions: true,
          changes: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
    } else if (action === 'athletes') result = await service.coachList(actor);
    else if (action === 'athlete')
      result = await service.coachAthleteData(
        actor,
        new URL(req.url).searchParams.get('id') || '',
      );
    else throw new CoachError('Operação não encontrada.', 404);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return coachErrorResponse(e);
  }
}
export async function POST(
  req: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new CoachError('Não autorizado', 401);
    const text = await req.text();
    if (text.length > 1000000)
      throw new CoachError('Envie até 1 MB por operação.', 413);
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw new CoachError('Envie JSON válido.', 400);
    }
    const { action } = await params;
    const handlers: Record<
      string,
      (actor: Actor, input: unknown) => Promise<unknown>
    > = {
      invite: service.inviteAthlete,
      respond: service.respondInvitation,
      end: service.endLink,
      notes:service.saveDraftNotes,
      message: service.coachMessage,
      race: service.coachRace,
      profile: service.coachProfile,
      session: service.upsertSession,
      batch: service.draftOperation,
      generate: service.generateCoachDraft,
      publish: service.publishDraft,
      rebase: service.rebaseDraft,
    };
    if (!handlers[action])
      throw new CoachError('Operação não encontrada.', 404);
    return Response.json(await handlers[action](session.user, body), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    if (e instanceof z.ZodError)
      return Response.json(
        {
          error: 'Confira os campos.',
          details: e.issues.map((i) => ({
            field: i.path.join('.'),
            message: /^(Invalid|Too |Expected|Unrecognized)/.test(i.message)
              ? 'Valor inválido. Confira este campo.'
              : i.message,
          })),
        },
        { status: 422 },
      );
    return coachErrorResponse(e);
  }
}
