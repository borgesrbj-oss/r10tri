import { publicProfile } from '@/lib/profile-public';
export const dynamic = 'force-dynamic';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ConfigurarTreinoClient } from './_components/configurar-treino-client';

export default async function ConfigurarTreinoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const profile = await prisma.athleteProfile.findUnique({ where: { userId: session.user.id } });
  return <ConfigurarTreinoClient profile={profile ? JSON.parse(JSON.stringify(publicProfile(profile))) : null} />;
}
