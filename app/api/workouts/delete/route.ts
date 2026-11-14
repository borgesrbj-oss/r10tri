export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  const role = (session.user as any).role;
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });
  // Coach pode excluir treino de qualquer atleta; atleta apenas o próprio
  const where = role === 'coach' ? { id } : { id, userId: session.user.id };
  const w = await prisma.workout.findFirst({ where });
  if (!w) return NextResponse.json({ error: 'Treino nao encontrado' }, { status: 404 });
  await prisma.workout.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
