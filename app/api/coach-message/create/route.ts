export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { buildWaLink } from '@/lib/wa';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if ((session.user as any).role !== 'coach') return NextResponse.json({ error: 'Apenas o coach pode enviar mensagens' }, { status: 403 });

  const { userId, message } = await req.json();
  const cleanMsg = String(message || '').trim();
  if (!userId || !cleanMsg) return NextResponse.json({ error: 'Atleta e mensagem são obrigatórios' }, { status: 400 });

  const athlete = await prisma.user.findUnique({ where: { id: String(userId) }, include: { profile: true } });
  if (!athlete) return NextResponse.json({ error: 'Atleta não encontrado' }, { status: 404 });

  await prisma.coachMessage.create({
    data: { userId: String(userId), coachId: session.user.id, message: cleanMsg },
  });

  const waLink = buildWaLink(athlete.profile?.whatsapp, `Olá${athlete.name ? ' ' + athlete.name : ''}! ${cleanMsg}`);
  return NextResponse.json({ ok: true, waLink });
}
