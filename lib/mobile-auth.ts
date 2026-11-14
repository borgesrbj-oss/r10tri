/** Autenticação mobile reutiliza a verificação de credenciais do NextAuth. */
import { createHmac, timingSafeEqual } from 'crypto';
import { configuredAppOrigin, mobileLinkAllowed, requiredAuthSecret } from './auth-policy';

// v4 (`next-auth.`) and Auth.js v5 (`authjs.`), with and without the https `__Secure-` prefix.
export const SESSION_COOKIE_NAMES = [
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
  '__Secure-authjs.session-token',
  'authjs.session-token',
];

/** Marks a mobile Google sign-in as in flight; see strandedMobileSignIn in the bridge. */
export const MOBILE_OAUTH_COOKIE = 'sb_mobile_oauth';

/** Destinos mobile são permitidos somente pela configuração explícita da aplicação. */
export async function isAllowedDeepLink(target: string): Promise<boolean> {
  return mobileLinkAllowed(target);
}

function sign(value: string): string {
  return createHmac('sha256', requiredAuthSecret()).update(value).digest('base64url');
}

/** Round-trips the deep link through Google without letting anyone else choose it. */
export function signDeepLink(target: string): string {
  const encoded = Buffer.from(target, 'utf8').toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

/** The signed deep link, or null if it was absent, malformed or tampered with. */
export async function verifyDeepLink(signed: string): Promise<string | null> {
  const dot = signed.lastIndexOf('.');
  if (dot <= 0) return null;
  const encoded = signed.slice(0, dot);
  const provided = signed.slice(dot + 1);
  const expected = sign(encoded);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const target = Buffer.from(encoded, 'base64url').toString('utf8');
  return (await isAllowedDeepLink(target)) ? target : null;
}

export type MobileLoginResult =
  | { ok: true; token: string }
  | { ok: false; status: number; message: string };

/** Absolute origin of this app, for server-to-server calls back into it. */
export async function selfOrigin(): Promise<string> {
  // Nunca derive o destino de credenciais ou tokens de cabeçalhos enviados pelo cliente.
  return configuredAppOrigin();
}

function parseSetCookie(raw: string[]): { session?: string; jar: string } {
  const pairs: string[] = [];
  let session: string | undefined;
  for (const entry of raw) {
    const [pair] = entry.split(';');
    const eq = pair.indexOf('=');
    if (eq === -1) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    pairs.push(`${name}=${value}`);
    if (SESSION_COOKIE_NAMES.includes(name) && value) session = value;
  }
  return { session, jar: pairs.join('; ') };
}

function readSetCookie(res: Response): string[] {
  // getSetCookie() is the only correct way to read multiple Set-Cookie headers.
  const anyHeaders = res.headers as unknown as { getSetCookie?: () => string[] };
  if (typeof anyHeaders.getSetCookie === 'function') return anyHeaders.getSetCookie();
  const single = res.headers.get('set-cookie');
  return single ? [single] : [];
}

/**
 * Logs in through `/api/auth/callback/credentials` and returns the resulting
 * session token (the value of the NextAuth session cookie).
 *
 * `credentials` is forwarded as-is, so apps whose provider expects
 * `username` (or any other field) instead of `email` work unchanged.
 */
export async function issueSessionTokenForCredentials(
  credentials: Record<string, string>,
): Promise<MobileLoginResult> {
  const origin = await selfOrigin();

  // `manual` everywhere below: these calls carry no session, so a guard over
  // /api/* answers a redirect to an HTML page. Following it would turn "blocked"
  // into a 200 that parses as an empty body and reads as a plain auth failure.
  const csrfRes = await fetch(`${origin}/api/auth/csrf`, { cache: 'no-store', redirect: 'manual' });
  if (!csrfRes.ok) {
    return { ok: false, status: 500, message: 'Authentication is unavailable' };
  }
  const { jar } = parseSetCookie(readSetCookie(csrfRes));
  const csrfBody = (await csrfRes.json().catch(() => ({}))) as { csrfToken?: string };
  const csrfToken = csrfBody?.csrfToken;
  if (!csrfToken) {
    return { ok: false, status: 500, message: 'Authentication is unavailable' };
  }

  const form = new URLSearchParams({ csrfToken, json: 'true' });
  for (const [key, value] of Object.entries(credentials)) {
    if (value !== undefined && value !== null) form.set(key, String(value));
  }

  const loginRes = await fetch(`${origin}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(jar ? { cookie: jar } : {}),
    },
    body: form.toString(),
    redirect: 'manual',
    cache: 'no-store',
  });

  const { session } = parseSetCookie(readSetCookie(loginRes));
  if (!session) {
    // NextAuth answers a rejected credentials login with a redirect that
    // carries ?error=, and sets no session cookie.
    return { ok: false, status: 401, message: 'Invalid email or password' };
  }
  return { ok: true, token: session };
}

/** Resolves the session user for a raw cookie header, via NextAuth itself. */
export async function sessionForCookieHeader(
  cookieHeader: string,
): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${await selfOrigin()}/api/auth/session`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
    redirect: 'manual',
  });
  if (!res.ok) return null;
  const body = (await res.json().catch(() => null)) as { user?: Record<string, unknown> } | null;
  return body?.user ?? null;
}

/** Fetches the session for a token, so callers can return the user object.
 *
 * Sends the token under every name a NextAuth/Auth.js app might read, for the same reason
 * the bridge does: the app's version is not knowable from here.
 */
export async function sessionForToken(token: string): Promise<Record<string, unknown> | null> {
  return sessionForCookieHeader(SESSION_COOKIE_NAMES.map((name) => `${name}=${token}`).join('; '));
}
