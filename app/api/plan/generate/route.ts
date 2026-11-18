import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { generateNutrition } from '@/lib/plan-engine';
import { calendarDay, generateStructuredPlan } from '@/lib/training-structure';
import { assessmentReadiness } from '@/lib/assessment-validation';
import { trainingFeedback } from '@/lib/training-feedback';

export const dynamic='force-dynamic';
const options={headers:{'Cache-Control':'no-store'}};
export async function POST(req:NextRequest) {
  const session=await auth();
  if(!session?.user?.id)return NextResponse.json({error:'Não autorizado'},{status:401,...options});
  const body=await req.json().catch(()=>null);
  if(!body || typeof body!=='object')return NextResponse.json({error:'Envie os dados do plano em JSON.'},{status:400,...options});
  const isCoach=session.user.role==='coach';
  if(body.targetUserId && body.targetUserId!==session.user.id && !isCoach)return NextResponse.json({error:'Sem permissão para gerar o plano de outro atleta.'},{status:403,...options});
  const userId=isCoach && typeof body.targetUserId==='string' ? body.targetUserId : session.user.id;
  const profile=await prisma.athleteProfile.findUnique({where:{userId}});
  const modality=body.modality ?? profile?.modality;
  if(!['triatlo','natacao','ciclismo','corrida'].includes(modality))return NextResponse.json({error:'Escolha uma modalidade válida.'},{status:422,...options});
  const goals:Record<string,string[]>={corrida:['iniciacao','retorno','pace','5k','10k','15k','21k','42k'],ciclismo:['base','ftp','endurance'],natacao:['tecnica','css','velocidade','aguas_abertas'],triatlo:['supersprint','sprint','olimpica','70.3','ironman']};
  if(body.goal!==undefined && (typeof body.goal!=='string'||!goals[modality]?.includes(body.goal)))return NextResponse.json({error:'Escolha um objetivo compatível com a modalidade.'},{status:422,...options});
  if(body.structure!==undefined && !['zona','distancia'].includes(body.structure))return NextResponse.json({error:'Escolha estrutura por FC ou distância.'},{status:422,...options});
  const selected={...profile,modality,trainingGoal:body.goal ?? null,runStructure:body.structure ?? profile?.runStructure};
  const readiness=assessmentReadiness(selected);
  if(!readiness.complete)return NextResponse.json({error:`Complete a triagem antes de gerar: ${readiness.missing.join(', ')}.`,missing:readiness.missing},{status:422,...options});
  const weeks=body.weeks===undefined ? undefined : Number(body.weeks);
  if(weeks!==undefined && (!Number.isInteger(weeks)||weeks<1||weeks>52))return NextResponse.json({error:'Escolha um plano de 1 a 52 semanas.'},{status:422,...options});
  if(body.startDate!==undefined && (typeof body.startDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(body.startDate)||!calendarDay(body.startDate)))return NextResponse.json({error:'Informe uma data de início válida.'},{status:422,...options});
  const races=await prisma.targetRace.findMany({where:{userId},orderBy:{date:'asc'}});
  const now=new Date();
  const [logs,past]=await Promise.all([
    prisma.workoutLog.findMany({where:{userId,completedAt:{gte:new Date(now.getTime()-7*86400000)}},select:{completedAt:true,actualDuration:true,rpe:true,sleepHours:true,fatigueScore:true,painScore:true},take:50,orderBy:{completedAt:'desc'}}),
    prisma.workout.findMany({where:{userId,date:{gte:new Date(now.getTime()-7*86400000),lt:now},OR:[{planId:null},{plan:{status:'active'}}]},select:{date:true,completed:true},take:50}),
  ]);
  const feedback=trainingFeedback(logs,past,now);
  const generated=generateStructuredPlan(selected,races,profile!.availableDays,body.startDate,weeks,feedback);
  generated.summary.feedback={status:feedback.status,reasons:feedback.reasons,observedSessions:feedback.observedSessions};
  if(!generated.workouts.length)return NextResponse.json({error:'Não foi possível gerar sessões com essa disponibilidade.',warnings:generated.warnings},{status:422,...options});
  const workouts=generated.workouts;
  const upcomingRaces=races.filter(r=>new Date(r.date)>=new Date(workouts[0].date));
  const targetRace=upcomingRaces.find(r=>r.priority==='A') ?? upcomingRaces[0];
  const plan=await prisma.$transaction(async tx=>{
    // Só arquiva o plano anterior após validar o novo; todas as gravações são atômicas.
    await tx.trainingPlan.updateMany({where:{userId,status:'active'},data:{status:'archived'}});
    const created=await tx.trainingPlan.create({data:{userId,name:`Plano ${modality} — ${new Date(workouts[0].date).toLocaleDateString('pt-BR',{timeZone:'UTC'})}`,startDate:new Date(workouts[0].date),endDate:new Date(workouts[workouts.length-1].date),raceId:targetRace?.id || null,generatedBy:'app-estruturado',nutritionPlan:generateNutrition(selected),summary:JSON.parse(JSON.stringify(generated.summary)) as Prisma.InputJsonValue}});
    await tx.workout.createMany({data:workouts.map(workout=>({userId,planId:created.id,date:new Date(workout.date),modality:workout.modality,title:workout.title,description:workout.description,duration:workout.duration,targetZone:workout.targetZone,tssEstimate:workout.tssEstimate,phase:workout.phase,weekNumber:workout.weekNumber,structure:JSON.parse(JSON.stringify(workout.structure)) as Prisma.InputJsonValue}))});
    await tx.athleteProfile.update({where:{userId},data:{modality,...(['zona','distancia'].includes(body.structure)?{runStructure:body.structure}: {})}});
    return created;
  },{timeout:20000});
  return NextResponse.json({planId:plan.id,workoutsCount:workouts.length,generatedBy:'app-estruturado',warnings:generated.warnings,summary:generated.summary},options);
}
