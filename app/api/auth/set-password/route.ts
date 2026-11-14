export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { invitationIdentifier, invitationTokenHash, validInvitationToken } from '@/lib/invitations';

class InvalidInvitation extends Error {}

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corpo JSON inválido' }, { status: 400 });
  }
  const { email, password, token } = body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
  }
  if (password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres e no máximo 72 bytes' }, { status: 400 });
  }
  if (!validInvitationToken(token)) {
    return NextResponse.json({ error: 'Use o link de convite enviado pelo seu coach' }, { status: 400 });
  }
  const identifier = invitationIdentifier(email);
  const tokenHash = invitationTokenHash(token);
  const hashed = await bcrypt.hash(password, 12);
  try {
    await prisma.$transaction(async (transaction) => {
      const invitation = await transaction.verificationToken.findUnique({
        where: { identifier_token: { identifier, token: tokenHash } },
      });
      if (!invitation || invitation.expires <= new Date()) throw new InvalidInvitation();
      const user = await transaction.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (!user || user.password) throw new InvalidInvitation();
      const consumed = await transaction.verificationToken.deleteMany({
        where: { identifier, token: tokenHash, expires: { gt: new Date() } },
      });
      if (consumed.count !== 1) throw new InvalidInvitation();
      const updated = await transaction.user.updateMany({
        where: { id: user.id, password: null },
        data: { password: hashed },
      });
      if (updated.count !== 1) throw new InvalidInvitation();
    });
  } catch (error) {
    if (error instanceof InvalidInvitation) {
      return NextResponse.json({ error: 'Convite inválido, expirado ou já utilizado. Solicite outro ao seu coach.' }, { status: 400 });
    }
    throw error;
  }
  return NextResponse.json({ ok: true });
}
