import { CoachInbox } from '@/components/coach-inbox';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppNav } from '@/components/app-nav';
import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      {process.env.ENABLE_ABACUS_WIDGET === 'true' && (
        <Script
          src="https://apps.abacus.ai/chatllm/appllm-lib.js"
          strategy="afterInteractive"
        />
      )}
      <main
        id="conteudo"
        className="app-content mx-auto max-w-[1440px] px-4 py-6 lg:ml-56 lg:max-w-none lg:pl-8 lg:pr-8 lg:py-10"
      >
        {session.user.role === 'atleta' && <CoachInbox />}
        {children}
      </main>
    </div>
  );
}
