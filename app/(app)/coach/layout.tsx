import { auth } from '@/auth';
import { redirect } from 'next/navigation';
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await auth();
  if (!s?.user) redirect('/login');
  if (s.user.role !== 'coach') redirect('/dashboard');
  return children;
}
