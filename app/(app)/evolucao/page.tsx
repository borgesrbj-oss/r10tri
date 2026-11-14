import { auth } from '@/auth';
import { EvolucaoClient } from './_components/evolucao-client';
export default async function EvolucaoPage() {
  await auth();
  return <EvolucaoClient />;
}
