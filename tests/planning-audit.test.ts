import {editWorkoutStructure} from '../lib/workout-edit';
import {retargetBike} from '../lib/workout-reassessment';
import test from 'node:test';import assert from 'node:assert/strict';
import {generateStructuredPlan,readWorkoutStructure,buildWorkoutStructure} from '../lib/training-structure';
import {preparationIssues,thresholdMinutes,markRunningThreshold,swimmingAccessIssue} from '../lib/training-audit';
import {trainingFeedback} from '../lib/training-feedback';
const start='2027-02-15';const race={date:'2027-05-09',distance:'42k',priority:'A'};
const profile={birthDate:'1990-01-01',currentWeight:70,level:'avancado',modality:'corrida',trainingGoal:'42k',runStructure:'distancia',runThresholdPace:'05:00',currentWeeklyVol:5,weeklyHours:8,availableDays:['seg','ter','qua','qui','sex','sab','dom'],strengthAvailable:false,planningPreferences:{recentMinutes:{corrida:300},recentLongRunMinutes:75}};
const feedback=trainingFeedback([0,1,2].map(i=>({completedAt:new Date(new Date(start+'T12:00:00Z').getTime()-i*86400000),rpe:4,painScore:0,fatigueScore:2,sleepHours:8})),[],new Date(start+'T12:00:00Z'));
test('todas as modalidades exigem base própria e identificam agenda contraditória',()=>{
 for(const modality of ['corrida','ciclismo','natacao','triatlo'])assert.ok(preparationIssues({...profile,modality,trainingGoal:'base',planningPreferences:{}},[]).some(i=>i.field.startsWith('planningPreferences.recentMinutes.')));
 assert.ok(preparationIssues({...profile,daySchedule:JSON.stringify({ter:['corrida']}),dailyMinutes:{ter:0}},[race]).some(i=>i.field==='dailyMinutes.ter'));
 assert.ok(preparationIssues(profile,[]).some(i=>i.field==='raceDate'));
 assert.deepEqual(preparationIssues(profile,[race]),[]);
});

test('triagem não troca um triatlo por bike e corrida quando falta acesso à natação',()=>{
 const profileTri={...profile,modality:'triatlo',trainingGoal:'sprint',runStructure:'zona',planningPreferences:{recentMinutes:{natacao:0,ciclismo:120,corrida:90}}};
 assert.deepEqual(preparationIssues(profileTri,[]),[]);
 assert.deepEqual(preparationIssues({...profileTri,canSwim:true,hasPoolAccess:false,poolSize:'mar_aberto'},[]),[]);
 assert.deepEqual(preparationIssues({...profileTri,canSwim:true,hasPoolAccess:true,swimLevel:'basico'},[]),[]);
 assert.deepEqual(preparationIssues({...profileTri,canSwim:true,hasPoolAccess:false},[]).map(issue=>issue.field),['hasPoolAccess']);
 assert.equal(swimmingAccessIssue({...profileTri,canSwim:false,hasPoolAccess:false,poolSize:'mar_aberto'})?.field,'canSwim');
 assert.deepEqual(preparationIssues({...profile,hasPoolAccess:false,canSwim:false},[race]),[]);
});
test('maratona com base confirmada gera longão no fim de semana, progressão e taper, com sessões distintas',()=>{
 const plan=generateStructuredPlan(profile,[race],profile.availableDays,start,12,feedback);
 const longs=plan.workouts.filter(w=>w.title.startsWith('Longo'));
 assert.ok(longs.length>0);assert.ok(longs.every(w=>[0,6].includes(new Date(w.date).getUTCDay())));
 assert.ok(longs.find(w=>w.weekNumber===6)!.duration>longs[0].duration);
 assert.ok(longs.filter(w=>w.phase==='race').every(w=>w.duration<longs[0].duration));
 for(const label of ['Fartlek','Ritmo sustentado','Tiros','Rodagem leve'])assert.ok(plan.workouts.some(w=>w.title.startsWith(label)),label);
 assert.ok(plan.workouts.every(w=>w.date.slice(0,10)!==race.date));
 assert.equal(plan.summary.calculation?.inputs.raceDate,race.date);
 for(const w of plan.workouts){assert.ok(readWorkoutStructure(w.structure));assert.equal(w.structure.steps.reduce((s,b)=>s+b.durationSeconds,0),w.duration*60);}
});
test('classificação usa os alvos efetivos e soma aquecimento, recuperação ativa e desaquecimento',()=>{
 const structure=buildWorkoutStructure(profile,'corrida','build',60,600,'Z4');markRunningThreshold(structure,profile);
 const totals=thresholdMinutes(structure);assert.equal(totals.at,10);assert.equal(totals.above,0);assert.equal(totals.unknown,0);assert.equal(totals.total,60);assert.equal(totals.below,50);
 const interval=buildWorkoutStructure(profile,'corrida','build',60,600,'Z5');markRunningThreshold(interval,profile);assert.equal(thresholdMinutes(interval).above,10);
 const cycling=buildWorkoutStructure({ftp:200,hasPowerMeter:true},'ciclismo','build',60,600,'Z4');markRunningThreshold(cycling,{ftp:200});assert.equal(thresholdMinutes(cycling).unknown,10);
 assert.equal(thresholdMinutes(buildWorkoutStructure(null,'forca','base',30)).total,0);
});
test('condição relatada preserva bloqueio de intensidade e explica por que não há progressão',()=>{
 const plan=generateStructuredPlan({...profile,currentInjuries:'Restrição relatada'},[race],profile.availableDays,start,12,feedback);
 assert.equal(plan.summary.requiresCoachReview,true);
 assert.equal(plan.workouts.length,0);
 assert.ok(plan.warnings.some(w=>w.includes('profissional de saúde')));
});

test('agenda que só comporta até 20 min explica na prévia por que a maratona ficou leve',()=>{
 const constrained={...profile,level:'intermediario',planningPreferences:{...profile.planningPreferences,maxSessionMinutes:20}};
 const plan=generateStructuredPlan(constrained,[race],profile.availableDays,start,12,feedback);
 assert.ok(plan.workouts.length>0);
 assert.ok(plan.workouts.every(w=>w.duration<=20 && !w.structure.distribution.highSeconds));
 assert.ok(plan.warnings.some(w=>w.includes('ficou só em intensidade leve')&&w.includes('25 minutos')));
});

test('Z5 por FC fica integralmente acima do limiar e nunca passa da FC máxima informada',()=>{
 const mode={...profile,runStructure:'zona',hasHRM:true,thresholdHeartRate:170,maxHeartRate:176};
 const structure=buildWorkoutStructure(mode,'corrida','build',60,600,'Z5');
 markRunningThreshold(structure,mode);
 const block=structure.steps.find(step=>step.zone==='Z5')!;
 assert.deepEqual([block.target.low,block.target.high],[171,176]);
 assert.equal(thresholdMinutes(structure).above,10);
 const noMargin=buildWorkoutStructure({...mode,maxHeartRate:170},'corrida','build',60,600,'Z5');
 assert.ok(noMargin.steps.filter(step=>step.zone==='Z5').every(step=>step.target.unit==='s/km'));
});

test('encurtar corrida por km mantém as distâncias válidas e atualizar FTP muda a referência salva',()=>{
 const structure=buildWorkoutStructure(profile,'corrida','build',60,600,'Z5');markRunningThreshold(structure,profile);
 const changed=editWorkoutStructure(structure,45,'corrida',null,profile);assert.ok(readWorkoutStructure(changed));assert.equal(changed.prescriptionMode,'distancia');assert.ok(changed.steps.every(s=>Number(s.distanceMeters)>0));
 const bike=buildWorkoutStructure({ftp:200,hasPowerMeter:true},'ciclismo','base',60);markRunningThreshold(bike,{ftp:200});assert.equal(retargetBike(bike,{ftp:250,hasPowerMeter:true})?.thresholdReference?.value,250);
});
