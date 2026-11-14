export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  const logs = await prisma.weightLog.findMany({ where: { userId: session.user.id }, orderBy: { date: 'asc' }, take: 100 });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  const data = await req.json();
  const log = await prisma.weightLog.create({ data: { userId: session.user.id, weight: data.weight, notes: data.notes } });
  return NextResponse.json(log, { status: 201 });
}
