import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import { coachAthleteData } from '@/lib/coach-service';
import { CoachError } from '@/lib/coach-access';
import { CoachAthleteEditor } from '@/components/coach-athlete-editor';
export default async function Athlete({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await auth();
  if (!s?.user) redirect('/login');
  if (s.user.role !== 'coach') notFound();
  let data;
  try {
    data = await coachAthleteData(s.user, (await params).id);
  } catch (e) {
    if (e instanceof CoachError) notFound();
    throw e;
  }
  return <CoachAthleteEditor data={JSON.parse(JSON.stringify(data))} />;
}
