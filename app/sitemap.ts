import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

function getBaseUrl(host: string | null): string {
  if (host) return `https://${host}`;
  return process.env.NEXTAUTH_URL || 'https://eurdez.abacusai.app';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const baseUrl = getBaseUrl(host);
  const now = new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
