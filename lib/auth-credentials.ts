import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

export type LoginLookup = { kind: 'email' | 'username'; value: string };
export class LoginAreaMismatchError extends Error {
  constructor() {
    super(
      'Esta conta não pertence à área selecionada. Confira se deve entrar como Coach ou Atleta.',
    );
  }
}
export type CredentialRecord = {
  id: string;
  email: string;
  name: string | null;
  password: string | null;
  role: string;
  authVersion: number;
};

export function loginLookup(value: unknown): LoginLookup | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > 320) return null;
  if (normalized.includes('@')) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
      ? { kind: 'email', value: normalized }
      : null;
  }
  return /^[a-z0-9][a-z0-9._-]{1,49}$/.test(normalized)
    ? { kind: 'username', value: normalized }
    : null;
}

export function normalizedEmail(value: unknown): string | null {
  const parsed = loginLookup(value);
  return parsed?.kind === 'email' ? parsed.value : null;
}

export function newPasswordError(value: unknown): string | null {
  if (typeof value !== 'string' || value.length < 6)
    return 'A senha deve ter pelo menos 6 caracteres.';
  if (Buffer.byteLength(value, 'utf8') > 72)
    return 'A senha deve ter no máximo 72 bytes. Caracteres acentuados podem ocupar mais de um byte.';
  return null;
}

// Mantém o custo de comparação também para identificadores inexistentes ou ambíguos.
let dummyHash: Promise<string> | undefined;
function comparisonHash(): Promise<string> {
  dummyHash ??= bcrypt.hash(randomBytes(32).toString('hex'), 12);
  return dummyHash;
}

export async function authenticateCredentials(
  credentials: {
    email?: unknown;
    username?: unknown;
    password?: unknown;
    expectedRole?: unknown;
  },
  findMatches: (lookup: LoginLookup) => Promise<CredentialRecord[]>,
): Promise<CredentialRecord | null> {
  const lookup = loginLookup(credentials.email || credentials.username);
  const password = credentials.password;
  if (
    credentials.expectedRole !== undefined &&
    (typeof credentials.expectedRole !== 'string' ||
      !['coach', 'atleta'].includes(credentials.expectedRole))
  )
    return null;
  if (
    !lookup ||
    typeof password !== 'string' ||
    !password ||
    password.length > 1024
  )
    return null;
  const matches = await findMatches(lookup);
  const user = matches.length === 1 ? matches[0] : null;
  const hash = user?.password || (await comparisonHash());
  let valid = false;
  try {
    valid = await bcrypt.compare(password, hash);
  } catch {
    return null;
  }
  // Nunca escolhe arbitrariamente entre contas antigas que diferem apenas por caixa.
  if (!user?.password || !valid) return null;
  // A área solicitada é uma restrição de entrada, nunca uma concessão de papel.
  if (
    credentials.expectedRole !== undefined &&
    user.role !== credentials.expectedRole
  )
    throw new LoginAreaMismatchError();
  return user;
}

export function sessionVersionMatches(
  tokenVersion: unknown,
  currentVersion: number,
): boolean {
  return (
    (typeof tokenVersion === 'number' ? tokenVersion : 0) === currentVersion
  );
}
