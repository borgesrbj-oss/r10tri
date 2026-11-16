import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { loginLookup } from '@/lib/auth-credentials';
import { configuredAppOrigin } from '@/lib/auth-policy';
import { recoveryMailConfigured, sendPasswordResetEmail } from '@/lib/auth-mail';
import { createPasswordReset, PASSWORD_RESET_COOLDOWN_MS, PASSWORD_RESET_TTL_MS, passwordResetIdentifier, passwordResetUrl } from '@/lib/password-reset';

export const dynamic = 'force-dynamic';
const genericMessage = 'Se os dados corresponderem a uma conta, você receberá um link no e-mail cadastrado. Confira também a pasta de spam.';
const options = { headers: { 'Cache-Control': 'no-store' } };

export async function POST(request: NextRequest) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Envie um corpo JSON válido.' }, { status: 400, ...options }); }
  const lookup = loginLookup(body?.identifier || body?.email || body?.username);
  if (!lookup) return NextResponse.json({ error: 'Informe um e-mail ou usuário válido.' }, { status: 400, ...options });
  // A indisponibilidade é informada para qualquer identificador, antes de consultar contas.
  if (!recoveryMailConfigured()) return NextResponse.json({ error: 'A recuperação por e-mail ainda não está disponível. Solicite ajuda ao seu coach.', code: 'RECOVERY_UNAVAILABLE' }, { status: 503, ...options });
  let origin: string;
  try { origin = configuredAppOrigin(); } catch { return NextResponse.json({ error: 'A recuperação por e-mail está temporariamente indisponível.', code: 'RECOVERY_UNAVAILABLE' }, { status: 503, ...options }); }
  try {
    const users = await prisma.user.findMany({
      where: lookup.kind === 'email'
        ? { email: { equals: lookup.value, mode: 'insensitive' } }
        : { username: { equals: lookup.value, mode: 'insensitive' } },
      take: 2,
      select: { id: true, email: true },
    });
    if (users.length !== 1) return NextResponse.json({ message: genericMessage }, options);
    const user = users[0];
    const now = new Date();
    const reset = createPasswordReset(user.id, now);
    const ready = await prisma.$transaction(async (transaction) => {
      const recent = await transaction.verificationToken.findFirst({
        where: { identifier: passwordResetIdentifier(user.id) },
        orderBy: { expires: 'desc' },
      });
      if (recent && recent.expires.getTime() > now.getTime() + PASSWORD_RESET_TTL_MS - PASSWORD_RESET_COOLDOWN_MS) return false;
      await transaction.verificationToken.deleteMany({ where: { identifier: reset.record.identifier } });
      await transaction.verificationToken.create({ data: reset.record });
      return true;
    }, { isolationLevel: 'Serializable' });
    if (ready) {
      try { await sendPasswordResetEmail(user.email, passwordResetUrl(origin, user.id, reset.token)); }
      catch {
        // Não registra destinatário, corpo da mensagem, link, token nem credenciais SMTP.
        console.error('Não foi possível enviar a mensagem de recuperação de senha.');
      }
    }
    return NextResponse.json({ message: genericMessage }, options);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2034') {
      return NextResponse.json({ message: genericMessage }, options);
    }
    return NextResponse.json({ error: 'Não foi possível solicitar a recuperação agora. Tente novamente em instantes.' }, { status: 503, ...options });
  }
}
