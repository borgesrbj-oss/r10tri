import { refreshFutureBikeTargets } from '@/lib/workout-reassessment';
import { publicProfile } from '@/lib/profile-public';
import { assessmentData, assessmentReadiness } from '@/lib/assessment-validation';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
const options = {headers:{'Cache-Control':'no-store'}};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({error:'Não autorizado'},{status:401,...options});
  const userId=session.user.id;
  const previous=await prisma.athleteProfile.findUnique({where:{userId}});
  const parsed = assessmentData(await req.json().catch(()=>null), previous);
  if (!parsed.ok) return NextResponse.json({error:'Confira os dados da triagem.',details:parsed.errors},{status:422,...options});
  const readiness=assessmentReadiness({...previous,...parsed.data});
  const refreshed=await prisma.$transaction(async tx=>{const profile=await tx.athleteProfile.upsert({
    where:{userId},
    update:{...parsed.data,coachAssessmentDone:readiness.complete},
    create:{userId,...parsed.data,coachAssessmentDone:readiness.complete,availableDays:parsed.data.availableDays || []},
  });
  return refreshFutureBikeTargets(tx,userId,previous,profile);},{timeout:20000});
  return NextResponse.json({ok:true,assessment:readiness,updatedFutureBikeWorkouts:refreshed},options);
}

export async function GET() {
  const session=await auth();
  if(!session?.user?.id) return NextResponse.json({error:'Não autorizado'},{status:401,...options});
  const profile=await prisma.athleteProfile.findUnique({where:{userId:session.user.id}});
  return NextResponse.json(publicProfile(profile),options);
}
