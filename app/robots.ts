import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

function getBaseUrl(host: string | null): string {
  if (host) return `https://${host}`;
  return process.env.NEXTAUTH_URL || 'https://eurdez.abacusai.app';
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const baseUrl = getBaseUrl(host);

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/signup'],
        disallow: [
          '/api/',
          '/dashboard',
          '/atletas',
          '/calendario',
          '/configurar-treino',
          '/evolucao',
          '/exercicios',
          '/guia',
          '/guias',
          '/perfil',
          '/plano',
          '/planilha',
          '/provas',
          '/definir-senha',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
