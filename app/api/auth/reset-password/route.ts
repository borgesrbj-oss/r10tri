import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { newPasswordError } from '@/lib/auth-credentials';
import { passwordResetHash, passwordResetIdentifier, validPasswordResetToken } from '@/lib/password-reset';

export const dynamic = 'force-dynamic';
class InvalidReset extends Error {}
const options = { headers: { 'Cache-Control': 'no-store' } };

export async function POST(request: NextRequest) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Envie um corpo JSON válido.' }, { status: 400, ...options }); }
  const { userId, token, password } = body ?? {};
  const passwordError = newPasswordError(password);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400, ...options });
  if (typeof userId !== 'string' || !/^[a-z0-9_-]{1,128}$/i.test(userId) || !validPasswordResetToken(token)) {
    return NextResponse.json({ error: 'Link de recuperação inválido. Solicite outro em “Esqueci minha senha”.' }, { status: 400, ...options });
  }
  const identifier = passwordResetIdentifier(userId);
  const tokenHash = passwordResetHash(token);
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await prisma.$transaction(async (transaction) => {
      const record = await transaction.verificationToken.findUnique({ where: { identifier_token: { identifier, token: tokenHash } } });
      if (!record || record.expires <= new Date()) throw new InvalidReset();
      const consumed = await transaction.verificationToken.deleteMany({ where: { identifier, token: tokenHash, expires: { gt: new Date() } } });
      if (consumed.count !== 1) throw new InvalidReset();
      const changed = await transaction.user.updateMany({ where: { id: userId }, data: { password: passwordHash, authVersion: { increment: 1 } } });
      if (changed.count !== 1) throw new InvalidReset();
    });
  } catch (error) {
    if (error instanceof InvalidReset) return NextResponse.json({ error: 'Link inválido, expirado ou já utilizado. Solicite uma nova recuperação.' }, { status: 400, ...options });
    return NextResponse.json({ error: 'Não foi possível redefinir a senha agora. Tente novamente em instantes.' }, { status: 503, ...options });
  }
  return NextResponse.json({ ok: true, message: 'Senha atualizada. Entre novamente; suas sessões anteriores foram encerradas.' }, options);
}
