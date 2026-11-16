export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateCredentials } from '@/lib/auth-credentials';

export async function POST(req: NextRequest) {
  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Envie um corpo JSON válido.' }, { status: 400 }); }
  try {
    if (!body || typeof (body.email || body.username) !== 'string' || typeof body.password !== 'string') {
      return NextResponse.json({ error: 'Informe seu e-mail ou usuário e sua senha.' }, { status: 400 });
    }
    const user = await authenticateCredentials(body, (lookup) => prisma.user.findMany({
      where: lookup.kind === 'email'
        ? { email: { equals: lookup.value, mode: 'insensitive' } }
        : { username: { equals: lookup.value, mode: 'insensitive' } },
      take: 2,
      select: { id: true, name: true, email: true, password: true, role: true, authVersion: true },
    }));
    if (!user) {
      return NextResponse.json({ error: 'E-mail, usuário ou senha incorretos. Confira os dados ou use “Esqueci minha senha”.' }, { status: 401 });
    }
    return NextResponse.json({ id: user.id, email: user.email });
  } catch {
    return NextResponse.json({ error: 'O serviço de acesso está indisponível. Tente novamente em instantes.' }, { status: 503 });
  }
}
