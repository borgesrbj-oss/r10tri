import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { coachList } from '@/lib/coach-service';
import { CoachHub } from '@/components/coach-hub';
export default async function Coach() {
  const s = await auth();
  if (!s?.user) redirect('/login');
  if (s.user.role !== 'coach') redirect('/dashboard');
  return (
    <CoachHub links={JSON.parse(JSON.stringify(await coachList(s.user)))} />
  );
}
