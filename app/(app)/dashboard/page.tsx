import { publicProfile } from '@/lib/profile-public';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { DashboardClient } from './_components/dashboard-client';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id ?? '';
  const profile = await prisma.athleteProfile.findUnique({ where: { userId } });
  // Primeiro acesso do atleta: abrir o perfil para incluir data de nascimento, sexo, etc.
  if (userId && (session?.user as any)?.role !== 'coach' && (!profile || !profile.profileCompleted)) {
    redirect('/perfil');
  }
  const races = await prisma.targetRace.findMany({ where: { userId }, orderBy: { date: 'asc' } });
  const recentWorkouts = await prisma.workout.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 10 });
  const totalWorkouts = await prisma.workout.count({ where: { userId } });
  const completedWorkouts = await prisma.workout.count({ where: { userId, completed: true } });
  const localDay=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const today=new Date(`${localDay}T00:00:00Z`);
  const monday=new Date(today);monday.setUTCDate(today.getUTCDate()-((today.getUTCDay()+6)%7));
  const sunday=new Date(monday.getTime()+7*86400000);
  const activeScope={userId,paused:false,OR:[{planId:null},{plan:{status:'active'}}]};
  const [next,week]=await Promise.all([
    prisma.workout.findFirst({where:{...activeScope,date:{gte:today},completed:false},orderBy:{date:'asc'},select:{title:true,date:true,duration:true,structure:true,description:true,phase:true}}),
    prisma.workout.findMany({where:{...activeScope,date:{gte:monday,lt:sunday}},select:{duration:true,completed:true}}),
  ]);
  const upcomingRaces = races?.filter((r: any) => new Date(r?.date) > new Date()) ?? [];
  const coachMessages = userId ? await prisma.coachMessage.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10 }) : [];

  const serialized = {
    profile: profile ? JSON.parse(JSON.stringify(publicProfile(profile))) : null,
    next:next?JSON.parse(JSON.stringify(next)):null,
    week:{minutes:week.reduce((sum,item)=>sum+(item.duration??0),0),completed:week.filter(item=>item.completed).length,total:week.length},
    races: JSON.parse(JSON.stringify(races ?? [])),
    recentWorkouts: JSON.parse(JSON.stringify(recentWorkouts ?? [])),
    totalWorkouts: totalWorkouts ?? 0,
    completedWorkouts: completedWorkouts ?? 0,
    upcomingRaces: JSON.parse(JSON.stringify(upcomingRaces ?? [])),
    userName: session?.user?.name ?? 'Atleta',
    isCoach: (session?.user as any)?.role === 'coach',
    coachMessages: JSON.parse(JSON.stringify(coachMessages ?? [])),
  };

  return <DashboardClient data={serialized} />;
}
