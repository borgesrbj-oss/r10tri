export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if ((session.user as any).role !== 'coach') return NextResponse.json({ error: 'Apenas o coach pode excluir atletas' }, { status: 403 });

  const { id } = await req.json();
  const targetId = String(id || '').trim();
  if (!targetId) return NextResponse.json({ error: 'ID do atleta é obrigatório' }, { status: 400 });
  if (targetId === session.user.id) return NextResponse.json({ error: 'Você não pode excluir a própria conta' }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return NextResponse.json({ error: 'Atleta não encontrado' }, { status: 404 });
  if (target.role === 'coach') return NextResponse.json({ error: 'Não é possível excluir uma conta de coach' }, { status: 400 });

  // Cascata remove profile, provas, planos, treinos, logs e integrações
  await prisma.user.delete({ where: { id: targetId } });
  return NextResponse.json({ ok: true });
}
