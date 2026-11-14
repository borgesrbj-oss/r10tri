import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppNav } from '@/components/app-nav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="mx-auto max-w-[1200px] px-4 py-6">{children}</main>
    </div>
  );
}
