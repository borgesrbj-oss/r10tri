export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

// Salva (ou limpa) a chave de API do Intervals.icu no perfil do usuario logado.
// A chave e pessoal de cada atleta (Settings > Developer no Intervals.icu). Nunca e exposta ao client.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : '';

  // Garante que exista um AthleteProfile para o usuario.
  await prisma.athleteProfile.upsert({
    where: { userId: session.user.id },
    update: { intervalsIcuApiKey: apiKey || null },
    create: { userId: session.user.id, intervalsIcuApiKey: apiKey || null },
  });

  return NextResponse.json({ ok: true, hasKey: !!apiKey });
}
