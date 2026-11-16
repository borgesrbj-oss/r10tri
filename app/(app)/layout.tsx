import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppNav } from '@/components/app-nav';
import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <Script src="https://apps.abacus.ai/chatllm/appllm-lib.js" strategy="afterInteractive" />
      <main className="app-content mx-auto max-w-[1200px] px-4 py-6">{children}</main>
    </div>
  );
}
