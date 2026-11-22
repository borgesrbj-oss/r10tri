import { auth } from '@/auth';
import { redirect } from 'next/navigation';
export default async function Entrada() {
  const s = await auth();
  redirect(s?.user?.role === 'coach' ? '/coach' : '/dashboard');
}
