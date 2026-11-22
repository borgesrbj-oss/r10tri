import { canAccessAthlete } from '@/lib/coach-access';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const role = (session.user as any).role;
  const url = new URL(req.url);
  const qUserId = url.searchParams.get('userId');

  // Coach pode listar de um atleta específico; atleta lista as próprias
  const userId = role === 'coach' && qUserId ? qUserId : session.user.id;
  if (!(await canAccessAthlete(session.user, userId)))
    return Response.json(
      { error: 'Vínculo ativo não encontrado.' },
      { status: 404 },
    );
  const messages = await prisma.coachMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json(messages);
}

export async function POST() {
  // Marca mensagens como lidas (atleta)
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  await prisma.coachMessage.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
