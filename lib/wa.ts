// Helper para montar links de WhatsApp (wa.me click-to-chat).
// Não requer API/credenciais: o coach clica e envia pelo próprio WhatsApp.
export function normalizeWhatsapp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return null;
  // Número brasileiro local (10-11 dígitos, DDD + número) → prefixa 55
  if (digits.length >= 10 && digits.length <= 11) digits = '55' + digits;
  return digits;
}

export function buildWaLink(whatsapp: string | null | undefined, message?: string): string | null {
  const digits = normalizeWhatsapp(whatsapp);
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
