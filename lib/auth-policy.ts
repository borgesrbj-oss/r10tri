/** Permissões são atribuídas por administração do banco, nunca por e-mail autodeclarado. */
export function trustedRole(role: string | null | undefined): 'coach' | 'atleta' {
  return role === 'coach' ? 'coach' : 'atleta';
}

export function configuredAppOrigin(env: Readonly<Record<string, string | undefined>> = process.env): string {
  const configured = env.NEXTAUTH_URL || env.APP_ORIGIN;
  if (!configured) {
    if (env.NODE_ENV === 'production') throw new Error('Configure NEXTAUTH_URL ou APP_ORIGIN em produção.');
    const port = env.PORT || '3000';
    if (!/^\d{1,5}$/.test(port) || Number(port) > 65535 || Number(port) < 1) throw new Error('PORT inválida.');
    return `http://localhost:${port}`;
  }
  const parsed = new URL(configured);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('A origem da aplicação deve conter somente protocolo HTTP(S), host e porta.');
  }
  return parsed.origin;
}

export function mobileLinkAllowed(target: string, env: Readonly<Record<string, string | undefined>> = process.env): boolean {
  let parsed: URL;
  try { parsed = new URL(target); } catch { return false; }
  if (parsed.username || parsed.password) return false;
  const scheme = parsed.protocol.slice(0, -1).toLowerCase();
  const schemes = (env.MOBILE_DEEP_LINK_SCHEMES || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (!['http', 'https', 'javascript', 'data', 'file', 'vbscript'].includes(scheme) && schemes.includes(scheme)) return true;
  const isHttp = ['http', 'https'].includes(scheme);
  if (isHttp) {
    try { if (parsed.origin === configuredAppOrigin(env)) return true; } catch { return false; }
  }
  if (env.NODE_ENV === 'production') return false;
  if (scheme === 'exp') return true;
  if (!isHttp) return false;
  if (['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname.toLowerCase())) return true;
  const origins = (env.MOBILE_PREVIEW_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
  return origins.includes(parsed.origin);
}

export function requiredAuthSecret(env: Readonly<Record<string, string | undefined>> = process.env): string {
  const secret = env.AUTH_SECRET || env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('Configure AUTH_SECRET ou NEXTAUTH_SECRET antes de assinar links.');
  return secret;
}
