import test from 'node:test';import assert from 'node:assert/strict';
import {generateStructuredPlan} from '../lib/training-structure';
import {fitTimeConstraints} from '../lib/time-constraints';
import {assessmentReadiness} from '../lib/assessment-validation';
const days=['ter','qua','qui','sex','sab','dom'];
const base={birthDate:'1990-01-01',currentWeight:70,level:'intermediario',availableDays:days,currentWeeklyVol:5,strengthAvailable:false,runThresholdPace:'05:00',ftp:200,hasPowerMeter:true,swimCssPace:'02:00',planningPreferences:{recentMinutes:{corrida:120,ciclismo:120,natacao:60}}};
test('mais horas livres não aumentam a prescrição em nenhuma modalidade',()=>{
 for(const modality of ['corrida','ciclismo','natacao','triatlo']){
  const a=generateStructuredPlan({...base,modality,weeklyHours:10},[],days,'2027-01-04',4);
  const b=generateStructuredPlan({...base,modality,weeklyHours:30},[],days,'2027-01-04',4);
  const c=generateStructuredPlan({...base,modality,weeklyHours:null},[],days,'2027-01-04',4);
  assert.ok(a.workouts.length);assert.deepEqual(a.workouts,b.workouts);assert.deepEqual(a.workouts,c.workouts);
 }
});
test('reduzir tempo em um dia não aumenta minutos nos outros dias',()=>{
 const free=generateStructuredPlan({...base,modality:'corrida',weeklyHours:10},[],days,'2027-01-04',2);
 const limited=generateStructuredPlan({...base,modality:'corrida',weeklyHours:10,dailyMinutes:{ter:15}},[],days,'2027-01-04',2);
 for(const w of limited.workouts){const original=free.workouts.find(x=>x.date===w.date&&x.modality===w.modality)!;assert.ok(w.duration<=original.duration);}
 assert.ok(limited.warnings.some(w=>w.includes('sobra não foi transferida')));
});
test('limites diário e semanal só reduzem, mantêm proporção e não alteram a prescrição original',()=>{
 const date=new Date('2027-01-05T12:00:00Z');const original=[{date,minutes:60,modality:'ciclismo'},{date,minutes:30,modality:'corrida'}];
 const fitted=fitTimeConstraints(original,{ter:45},undefined,null);assert.deepEqual(fitted.map(s=>s.minutes),[30,15]);assert.deepEqual(original.map(s=>s.minutes),[60,30]);
 assert.ok(fitTimeConstraints(original,{},undefined,40).reduce((s,w)=>s+w.minutes,0)<=40);
 assert.deepEqual(fitTimeConstraints(original,{ter:0}),[]);
});
test('horário é opcional, mas limite semanal explícito inválido é sinalizado',()=>{
 assert.equal(assessmentReadiness({...base,modality:'corrida',weeklyHours:null}).complete,true);
 assert.equal(assessmentReadiness({...base,modality:'corrida',weeklyHours:0}).complete,false);
});
