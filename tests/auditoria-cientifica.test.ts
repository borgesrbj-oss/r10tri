import test from 'node:test';
import assert from 'node:assert/strict';
import {generateStructuredPlan,readWorkoutStructure,buildWorkoutStructure} from '../lib/training-structure';
import {trainingFeedback} from '../lib/training-feedback';
import {editWorkoutStructure} from '../lib/workout-edit';
import {assessmentData} from '../lib/assessment-validation';
import {auditProfiles,auditStart} from './fixtures/audit-profiles';
for(const item of auditProfiles)test(`perfil fictício: ${item.name}`,()=>{
 const date=new Date(auditStart+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+item.raceWeeks*7);
 const plan=generateStructuredPlan(item.profile,[{date,priority:'A'}],item.profile.availableDays!,auditStart,Math.min(12,item.raceWeeks+2));
 assert.ok(plan.workouts.length>0);
 for(const week of plan.summary.weeks)assert.ok(week.plannedMinutes<=Number(item.profile.weeklyHours)*60 && week.distribution.highFraction<=.200001);
 for(const workout of plan.workouts){assert.ok(readWorkoutStructure(workout.structure));assert.equal(workout.duration*60,workout.structure.steps.reduce((sum,step)=>sum+step.durationSeconds,0));assert.ok(workout.description.includes('Objetivo:'));}
 const quality=[...new Set(plan.workouts.filter(workout=>workout.structure.distribution.highSeconds>0).map(workout=>workout.date))].map(date=>new Date(date).getTime());
 for(let i=1;i<quality.length;i++)assert.ok(quality[i]-quality[i-1]>=2*86400000);
 if(item.name==='Sedentário iniciante')assert.ok(plan.workouts.some(workout=>workout.structure.steps.some(step=>step.label.includes('Caminhada'))));
 if(item.name==='Nadador pouco experiente'){assert.equal(plan.summary.distribution.highSeconds,0);assert.ok(plan.workouts.some(workout=>workout.structure.steps.some(step=>step.label.includes('respiração'))));}
 if(item.name==='Objetivo incompatível com prazo')assert.equal(plan.summary.requiresCoachReview,true);
 if(item.name==='Disponibilidade limitada')assert.ok(plan.summary.weeks.every(week=>week.plannedMinutes<=15));
});
const baseline=auditProfiles[2].profile, now=new Date(auditStart+'T12:00:00Z');
test('feedback recente reduz volume e intensidade sem compensar faltas',()=>{
 const normal=generateStructuredPlan(baseline,[],baseline.availableDays!,auditStart,4);
 for(const log of [{painScore:2},{fatigueScore:9},{sleepHours:4}]){
  const feedback=trainingFeedback([{completedAt:now,...log}],[],now);
  const adjusted=generateStructuredPlan(baseline,[],baseline.availableDays!,auditStart,4,feedback);
  assert.ok(adjusted.summary.weeks[0].plannedMinutes<normal.summary.weeks[0].plannedMinutes);
  assert.equal(adjusted.summary.weeks[0].distribution.highSeconds,0);
 }
 const missed=trainingFeedback([],Array.from({length:3},()=>({date:new Date(now.getTime()-86400000),completed:false})),now);
 assert.equal(missed.growth,0);assert.ok(missed.initialFactor<=1);
 assert.equal(trainingFeedback([{completedAt:'2025-01-01',painScore:8}],[],now).status,'manter');
});
test('evidência de tolerância permite progressão limitada; ausência não aumenta carga',()=>{
 const positive=trainingFeedback(Array.from({length:3},(_,index)=>({completedAt:new Date(now.getTime()-index*86400000),painScore:0,fatigueScore:2,sleepHours:8,rpe:4})),[],now);
 assert.equal(positive.status,'progredir');assert.ok(positive.growth>0&&positive.growth<=.05);
 assert.equal(trainingFeedback().growth,0);
 assert.equal(trainingFeedback([{completedAt:now},{completedAt:new Date(now.getTime()-86400000),painScore:3}],[],now).status,'revisar');
 assert.equal(trainingFeedback(Array.from({length:3},()=>({completedAt:now,painScore:0,fatigueScore:2,sleepHours:8,rpe:4})),[],now).growth,0);
  assert.equal(trainingFeedback([],Array.from({length:3},()=>({date:now,completed:false})),now).initialFactor,1);
});
test('limites por dia somam todas as modalidades e aceitam descanso zero',()=>{
 const profile={...baseline,modality:'triatlo',availableDays:['seg','qua','sex'],dailyMinutes:{seg:20,qua:0,sex:35},daySchedule:JSON.stringify({seg:['corrida','forca'],qua:['natacao'],sex:['ciclismo','corrida']})};
 const plan=generateStructuredPlan(profile,[],profile.availableDays,auditStart,8);
 const days:Record<string,number>={};for(const workout of plan.workouts)days[workout.date]=(days[workout.date]||0)+workout.duration;
 for(const [date,minutes]of Object.entries(days))assert.ok(minutes<=(new Date(date).getUTCDay()===1?20:35));
 assert.ok(plan.workouts.every(workout=>new Date(workout.date).getUTCDay()!==3));
 assert.equal(assessmentData({dailyMinutes:{seg:-1}}).ok,false);
});
test('afastamento, prioridade A e metas agressivas provocam revisão coerente',()=>{
 const returning=generateStructuredPlan({...baseline,inactivityWeeks:8},[],baseline.availableDays!,auditStart,4);
 assert.equal(returning.summary.distribution.highSeconds,0);assert.ok(returning.workouts[0].duration<40);
 const aggressive=generateStructuredPlan({...baseline,trainingGoal:'10k',goalTime:'25:00',recentRaceDistanceKm:5,recentRaceTimeSeconds:1800,recentRaceDate:'2026-11-01'},[],baseline.availableDays!,auditStart,4);
 assert.equal(aggressive.summary.requiresCoachReview,true);
 const priority=generateStructuredPlan(baseline,[{date:'2026-12-01',priority:'B'},{date:'2027-03-01',priority:'A'}],baseline.availableDays!,auditStart);
 assert.ok(priority.summary.weeks.length>12);assert.ok(!priority.workouts.some(workout=>workout.date.startsWith('2026-12-01')));
});
test('edição redimensiona blocos sem manter soma antiga e exige revisão',()=>{
 const original=buildWorkoutStructure(baseline,'corrida','build',45,600);
 const edited=editWorkoutStructure(original,60,'corrida','Z2',baseline);
 assert.equal(edited.steps.reduce((sum,step)=>sum+step.durationSeconds,0),3600);assert.ok(readWorkoutStructure(edited));assert.equal(edited.requiresCoachReview,true);
 assert.equal(original.durationSeconds,2700);assert.throws(()=>editWorkoutStructure(original,-1,'corrida',null,baseline));
 const changed=editWorkoutStructure(original,30,'ciclismo',null,baseline);
 assert.equal(changed.modality,'ciclismo');assert.equal(changed.requiresCoachReview,true);assert.equal(changed.steps.reduce((sum,step)=>sum+step.durationSeconds,0),1800);
});
