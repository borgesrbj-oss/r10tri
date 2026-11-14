export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });
  const race = await prisma.targetRace.findFirst({ where: { id, userId: session.user.id } });
  if (!race) return NextResponse.json({ error: 'Prova nao encontrada' }, { status: 404 });
  await prisma.targetRace.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
