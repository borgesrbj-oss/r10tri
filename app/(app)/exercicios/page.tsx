import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ExerciciosClient } from './_components/exercicios-client';

export default async function ExerciciosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  return <ExerciciosClient />;
}
