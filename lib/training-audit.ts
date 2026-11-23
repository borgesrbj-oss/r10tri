import type {TrainingProfile,TrainingRace,TrainingPhase,WorkoutStructure} from './training-types';
import {preferences} from './planning-preferences';
import {runThreshold,swimThreshold,numericValue,formatPaceSeconds} from './training-zones';
export function preparationIssues(profile:TrainingProfile|null,races:TrainingRace[],start:Date|string=new Date()) {
 if(!profile)return [];
 const sports=profile.modality==='triatlo'?['corrida','ciclismo','natacao']:['corrida','ciclismo','natacao'].includes(String(profile.modality))?[String(profile.modality)]:[];
 const issues:{field:string;message:string}[]=[];
 const prefs=preferences(profile.planningPreferences);
 for(const sport of sports)if(prefs.recentMinutes?.[sport]==null||!Number.isFinite(Number(prefs.recentMinutes[sport])))issues.push({field:'planningPreferences.recentMinutes.'+sport,message:'Informe o volume semanal recente de '+sport+' em minutos. Use 0 se ainda não pratica; o app não presumirá uma base.'});
 let schedule:Record<string,string[]>={};
 try{schedule=typeof profile.daySchedule==='string'?JSON.parse(profile.daySchedule):profile.daySchedule??{};}catch{issues.push({field:'availableDays',message:'Revise a agenda por modalidade: o formato salvo é inválido.'});}
 if(schedule&&typeof schedule==='object'&&!Array.isArray(schedule))for(const [day,planned] of Object.entries(schedule))if(Array.isArray(planned)&&planned.some(sport=>sports.includes(sport))&&profile.availableDays?.includes(day)&&Number((profile.dailyMinutes as Record<string,unknown>|null)?.[day])===0)issues.push({field:'dailyMinutes.'+day,message:'Há modalidade marcada neste dia, mas o limite é zero minutos. Revise a agenda ou o limite diário.'});
 if(profile.modality!=='corrida'||profile.trainingGoal!=='42k')return issues;
 if(!(Number(prefs.recentLongRunMinutes)>0))issues.push({field:'planningPreferences.recentLongRunMinutes',message:'Informe a duração do maior longão concluído nas últimas quatro semanas.'});
 if(Number(prefs.recentLongRunMinutes)>Number(prefs.recentMinutes?.corrida))issues.push({field:'planningPreferences.recentLongRunMinutes',message:'O longão recente não pode superar o volume semanal de corrida informado.'});
 if(!runThreshold(profile)&&!(Number(profile.thresholdHeartRate)>0&&profile.hasHRM!==false))issues.push({field:'runThresholdPace',message:'Informe pace de limiar ou FC de limiar medida para definir as intensidades. Ritmo habitual não é limiar.'});
 const date=new Date(start).getTime();
 if(!races.some(r=>/^42(?:[.,](?:195|2))?(?:k|km)?$/i.test(String(r.distance).replace(/\s/g,''))&&Number.isFinite(new Date(r.date).getTime())&&new Date(r.date).getTime()>=date))issues.push({field:'raceDate',message:'Cadastre a maratona com dia, mês e ano. Apenas o mês não permite calcular a redução de volume antes da prova.'});
 return issues;
}
export function recentLongRunLimit(options:unknown,week:number,growth:number,phase:TrainingPhase,recovery:boolean){
 const minutes=preferences(options).recentLongRunMinutes;
 if(!(Number(minutes)>0))return Infinity;
 const factor=phase==='transition'?.35:phase==='race'?.35:phase==='peak'?.7:recovery?.65:1;
 return Math.max(10,Math.floor(Number(minutes)*Math.pow(1+growth,Math.max(0,week-Math.floor(week/4)))*factor));
}
/** Referência de limiar fica junto da prescrição, sem recalcular o histórico com o perfil atual. */
export function markRunningThreshold(structure:WorkoutStructure,profile:TrainingProfile|null){
 const pace=runThreshold(profile),hr=numericValue(profile?.thresholdHeartRate);
 if(structure.modality==='ciclismo'){const ftp=numericValue(profile?.ftp)??numericValue(profile?.testFTPEstimated);if(ftp&&structure.steps.some(s=>s.target.basis==='ftp'))structure.thresholdReference={basis:'ftp',value:ftp};return;}
 if(structure.modality==='natacao'){const target=structure.steps.find(s=>s.target.basis==='css');if(target){const value=swimThreshold(profile);if(value)structure.thresholdReference={basis:'css',value};}return;}
 if(structure.modality!=='corrida')return;
 const useHr=structure.steps.some(s=>s.target.basis==='threshold_hr');
 const value=useHr?hr:pace;
 if(!value)return;
 structure.thresholdReference={basis:useHr?'threshold_hr':'run_threshold',value};
 for(const step of structure.steps)if(step.zone==='Z4'&&step.target.basis===structure.thresholdReference.basis){
   step.target={...step.target,low:value,high:value,text:useHr?`${value} bpm — limiar medido`:`${formatPaceSeconds(value)}/km — limiar medido`};
   if(step.distanceMeters)step.distanceMeters=Math.max(10,Math.round(step.durationSeconds/value*100)*10);
 }
}
export type ThresholdMinutes={total:number;below:number;at:number;above:number;unknown:number};
export function thresholdMinutes(structure:WorkoutStructure):ThresholdMinutes {
 const result={total:0,below:0,at:0,above:0,unknown:0};
 if(structure.modality==='forca')return result;
 for(const step of structure.steps){
   if(step.rest==='passivo')continue;
   const minutes=step.durationSeconds/60;result.total+=minutes;
   const reference=structure.thresholdReference;
   if(!reference||step.target.basis!==reference.basis){result.unknown+=minutes;continue;}
   const {low,high}=step.target;
   const category: keyof Omit<ThresholdMinutes,'total'>=low===reference.value&&high===reference.value?'at':['run_threshold','css'].includes(reference.basis)?(low>reference.value?'below':high<reference.value?'above':'unknown'):(high<reference.value?'below':low>reference.value?'above':'unknown');
   result[category]+=minutes;
 }
 return result;
}
