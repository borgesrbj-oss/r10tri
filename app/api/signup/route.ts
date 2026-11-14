export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, whatsapp } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name: name || 'Atleta' },
    });
    const wa = typeof whatsapp === 'string' ? whatsapp.trim() : '';
    if (wa) {
      await prisma.athleteProfile.upsert({
        where: { userId: user.id },
        update: { whatsapp: wa },
        create: { userId: user.id, whatsapp: wa },
      });
    }
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (e: any) {
    console.error('Signup error:', e);
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 });
  }
}
