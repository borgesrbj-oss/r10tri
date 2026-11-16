import { createHash, randomBytes } from 'node:crypto';

export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
export const PASSWORD_RESET_COOLDOWN_MS = 60 * 1000;

export function passwordResetIdentifier(userId: string): string {
  return `redefinir-senha:${userId}`;
}

export function passwordResetHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function validPasswordResetToken(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

export function createPasswordReset(userId: string, now = new Date()) {
  const token = randomBytes(32).toString('hex');
  return {
    token,
    record: {
      identifier: passwordResetIdentifier(userId),
      token: passwordResetHash(token),
      expires: new Date(now.getTime() + PASSWORD_RESET_TTL_MS),
    },
  };
}

export function passwordResetUrl(origin: string, userId: string, token: string): string {
  const url = new URL('/redefinir-senha', origin);
  // O fragmento não segue na requisição de navegação nem no cabeçalho Referer.
  url.hash = new URLSearchParams({ conta: userId, token }).toString();
  return url.toString();
}
