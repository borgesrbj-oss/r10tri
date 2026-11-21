import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { trainingFeedback } from '@/lib/training-feedback';
export const dynamic='force-dynamic';
export async function GET() {
  const session=await auth();
  const headers={'Cache-Control':'no-store'};
  if(!session?.user?.id)return NextResponse.json({error:'Não autorizado'},{status:401,headers});
  const userId=session.user.id, now=new Date(),since=new Date(now.getTime()-7*86400000);
  const [logs,workouts]=await Promise.all([
    prisma.workoutLog.findMany({where:{userId,completedAt:{gte:since}},select:{completedAt:true,actualDuration:true,rpe:true,sleepHours:true,fatigueScore:true,painScore:true},orderBy:{completedAt:'desc'},take:50}),
    prisma.workout.findMany({where:{userId,paused:false,date:{gte:since,lt:now},OR:[{planId:null},{plan:{status:'active'}}]},select:{date:true,completed:true},take:50}),
  ]);
  return NextResponse.json(trainingFeedback(logs,workouts,now),{headers});
}
