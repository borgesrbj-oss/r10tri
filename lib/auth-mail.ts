// Alias separa o envio próprio do peer opcional antigo do provider de e-mail Auth.js (não usado).
import nodemailer from 'nodemailer-smtp';
import { escapeHtml } from '@/lib/invitations';

type Environment = Readonly<Record<string, string | undefined>>;
export type RecoveryMessage = { from: string; to: string; subject: string; text: string; html: string };
export type RecoverySender = (message: RecoveryMessage) => Promise<void>;

export function smtpConfiguration(env: Environment = process.env) {
  const host = env.SMTP_HOST?.trim();
  const from = env.SMTP_FROM?.trim();
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASSWORD;
  const port = Number(env.SMTP_PORT || '587');
  const secureValue = env.SMTP_SECURE?.trim();
  if (!host || !/^[a-z0-9.-]+$/i.test(host) || !from || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(from)) return null;
  if (!Number.isInteger(port) || port < 1 || port > 65535 || !user || !pass) return null;
  if (secureValue && secureValue !== 'true' && secureValue !== 'false') return null;
  const secure = secureValue ? secureValue === 'true' : port === 465;
  return { host, port, secure, auth: { user, pass }, from };
}

export function recoveryMailConfigured(): boolean {
  return smtpConfiguration() !== null;
}

export async function sendPasswordResetEmail(
  to: string,
  url: string,
  options: { env?: Environment; sender?: RecoverySender } = {},
): Promise<void> {
  const configuration = smtpConfiguration(options.env);
  if (!configuration) throw new Error('Recuperação por e-mail não configurada.');
  const message: RecoveryMessage = {
    from: configuration.from,
    to,
    subject: 'R10 TRI — redefinir sua senha',
    text: `Recebemos uma solicitação para redefinir sua senha no R10 TRI.\n\nAbra o link em até 30 minutos: ${url}\n\nO link pode ser usado uma vez. Se você não solicitou a alteração, ignore esta mensagem. Sua senha continua igual.`,
    html: `<p>Recebemos uma solicitação para redefinir sua senha no R10 TRI.</p><p><a href="${escapeHtml(url)}">Redefinir minha senha</a></p><p>Este link expira em 30 minutos e pode ser usado uma vez.</p><p>Se você não solicitou a alteração, ignore esta mensagem. Sua senha continua igual.</p>`,
  };
  if (options.sender) { await options.sender(message); return; }
  // Resend por HTTPS funciona também nos planos Railway que bloqueiam SMTP.
  if (configuration.host === 'smtp.resend.com') {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', redirect: 'error', cache: 'no-store',
      headers: { Authorization: `Bearer ${configuration.auth.pass}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...message, to: [message.to] }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error('O provedor recusou o envio de recuperação.');
    return;
  }
  const transport = nodemailer.createTransport({
    host: configuration.host,
    port: configuration.port,
    secure: configuration.secure,
    requireTLS: !configuration.secure,
    auth: configuration.auth,
    tls: { minVersion: 'TLSv1.2' },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    logger: false,
    debug: false,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  try { await transport.sendMail(message); } finally { transport.close(); }
}
