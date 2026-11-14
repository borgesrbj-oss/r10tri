import { createHash, randomBytes } from 'node:crypto';

export const INVITATION_DURATION_MS = 48 * 60 * 60 * 1000;

export function invitationIdentifier(email: string): string {
  return `convite:${email.trim().toLowerCase()}`;
}

export function invitationTokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function validInvitationToken(token: unknown): token is string {
  return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
}

export function newInvitation(email: string, now = new Date()) {
  const token = randomBytes(32).toString('hex');
  return {
    token,
    record: {
      identifier: invitationIdentifier(email),
      token: invitationTokenHash(token),
      expires: new Date(now.getTime() + INVITATION_DURATION_MS),
    },
  };
}

export function invitationUrl(origin: string, email: string, token: string): string {
  const url = new URL('/definir-senha', origin);
  // O fragmento não é enviado ao servidor em navegações nem no cabeçalho Referer.
  url.hash = new URLSearchParams({ email, convite: token }).toString();
  return url.toString();
}

export function escapeHtml(value: string): string {
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}
