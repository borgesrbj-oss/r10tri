export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  const races = await prisma.targetRace.findMany({ where: { userId: session.user.id }, orderBy: { date: 'asc' } });
  return NextResponse.json(races);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  const data = await req.json();
  if (data.id) {
    const race = await prisma.targetRace.update({ where: { id: data.id }, data: { name: data.name, date: new Date(data.date), distance: data.distance, notes: data.notes } });
    return NextResponse.json(race);
  }
  const race = await prisma.targetRace.create({ data: { userId: session.user.id, name: data.name, date: new Date(data.date), distance: data.distance, notes: data.notes } });
  return NextResponse.json(race, { status: 201 });
}
