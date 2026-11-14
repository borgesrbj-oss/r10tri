import { publicProfile } from '@/lib/profile-public';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { PerfilClient } from './_components/perfil-client';

export default async function PerfilPage() {
  const session = await auth();
  const userId = session?.user?.id ?? '';
  const profile = await prisma.athleteProfile.findUnique({ where: { userId } });
  return <PerfilClient profile={profile ? JSON.parse(JSON.stringify(publicProfile(profile))) : null} userName={session?.user?.name ?? ''} />;
}
