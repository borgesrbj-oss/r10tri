export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { buildWaLink } from '@/lib/wa';
import { escapeHtml, invitationUrl, newInvitation } from '@/lib/invitations';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if ((session.user as any).role !== 'coach') return NextResponse.json({ error: 'Apenas o coach pode cadastrar atletas' }, { status: 403 });

  const { email, name, whatsapp } = await req.json();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanName = String(name || '').trim();
  const cleanWhats = String(whatsapp || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return NextResponse.json({ error: 'Informe um e-mail válido' }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing && (existing.password || existing.role !== 'atleta')) {
    return NextResponse.json({ error: 'Já existe um usuário ativo com este e-mail' }, { status: 409 });
  }

  const invitation = newInvitation(cleanEmail);
  const user = await prisma.$transaction(async (transaction) => {
    const athlete = existing ?? await transaction.user.create({
      data: { email: cleanEmail, name: cleanName || null, role: 'atleta' },
    });
    if (cleanWhats) {
      await transaction.athleteProfile.upsert({
        where: { userId: athlete.id },
        update: { whatsapp: cleanWhats },
        create: { userId: athlete.id, whatsapp: cleanWhats },
      });
    }
    // Renovar um convite invalida os links anteriores, sem apagar o atleta.
    await transaction.verificationToken.deleteMany({ where: { identifier: invitation.record.identifier } });
    await transaction.verificationToken.create({ data: invitation.record });
    return athlete;
  });

  // Link do programa (primeiro acesso para definir senha)
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_ORIGIN || new URL(req.url).origin;
  const programLink = invitationUrl(baseUrl, cleanEmail, invitation.token);
  const welcomeText = `Olá${cleanName ? ' ' + cleanName : ''}! Você foi cadastrado(a) no R10 TRI pelo seu coach. Acesse o programa e defina sua senha no primeiro acesso: ${programLink}`;

  // E-mail de boas-vindas (não quebra o cadastro se falhar)
  let emailSent = false;
  try {
    const apiKey = process.env.ABACUSAI_API_KEY;
    const appId = process.env.WEB_APP_ID;
    const notifId = process.env.NOTIF_ID_BOASVINDAS_AO_ATLETA;
    if (apiKey && appId && notifId && baseUrl) {
      const senderEmail = `noreply@${new URL(baseUrl).hostname}`;
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
          <h2 style="color:#1A8A7D">Bem-vindo(a) ao R10 TRI! 🏊‍♂️🚴🏃</h2>
          <p>Olá${cleanName ? ' <strong>' + escapeHtml(cleanName) + '</strong>' : ''}, seu coach criou seu acesso à plataforma de treinos R10 TRI.</p>
          <p>Para começar, acesse o programa e defina sua senha no <strong>primeiro acesso</strong>:</p>
          <p style="text-align:center;margin:28px 0">
            <a href="${escapeHtml(programLink)}" style="background:#1A8A7D;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold">Acessar meu programa</a>
          </p>
          <p style="font-size:13px;color:#666">Ou copie este link: ${escapeHtml(programLink)}</p>
          <p style="font-size:13px;color:#666">O convite vale por 48 horas e pode ser utilizado uma vez.</p>
          <p style="font-size:13px;color:#666">Nade. Pedale. Corra. Evolua.</p>
        </div>`;
      const res = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          app_id: appId,
          notification_id: notifId,
          subject: 'Bem-vindo(a) ao R10 TRI — acesse seu programa de treinos',
          body: html,
          is_html: true,
          recipient_email: cleanEmail,
          sender_email: senderEmail,
          sender_alias: 'R10 TRI',
        }),
      });
      emailSent = res.ok;
    }
  } catch { /* ignora falha de e-mail */ }

  const waLink = buildWaLink(cleanWhats, welcomeText);
  return NextResponse.json({ ok: true, id: user.id, email: user.email, emailSent, waLink, invitationUrl: programLink, expiresAt: invitation.record.expires }, { headers: { 'Cache-Control': 'no-store' } });
}
