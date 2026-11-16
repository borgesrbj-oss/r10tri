export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { newPasswordError, normalizedEmail } from '@/lib/auth-credentials';

export async function POST(req: NextRequest) {
  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Envie um corpo JSON válido.' }, { status: 400 }); }
  try {
    const { password, name, whatsapp } = body ?? {};
    const email = normalizedEmail(body?.email);
    if (!email) return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 });
    const passwordError = newPasswordError(password);
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });
    const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    if (existing) {
      return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 12);
    const wa = typeof whatsapp === 'string' ? whatsapp.trim() : '';
    const user = await prisma.user.create({
      data: {
        email, password: hashed, name: typeof name === 'string' && name.trim() ? name.trim() : 'Atleta',
        ...(wa ? { profile: { create: { whatsapp: wa } } } : {}),
      },
    });
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Não foi possível criar sua conta. Tente novamente em instantes.' }, { status: 503 });
  }
}
