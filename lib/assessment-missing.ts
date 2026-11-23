import {runThreshold} from './training-zones';
export function missingAssessmentFields(form:Record<string,any>) {
 const fields:{field:string;label:string;step:number}[]=[];
 const add=(field:string,label:string,step:number)=>fields.push({field,label,step});
 if(!form.modality)add('modality','Modalidade',0);
 if(!form.level)add('level','Nível de experiência',1);
 if(['triatlo','natacao'].includes(form.modality)&&form.canSwim==null)add('canSwim','Informe se sabe nadar',2);
 if(!form.birthDate)add('birthDate','Data de nascimento',4);
 if(!(Number(form.currentWeight)>0))add('currentWeight','Peso atual',4);
 if(!Array.isArray(form.availableDays)||!form.availableDays.length)add('availableDays','Dias disponíveis',7);
 if(form.weeklyHours!=null&&form.weeklyHours!==''&&!(Number(form.weeklyHours)>0))add('weeklyHours','Limite semanal inválido; deixe vazio se não houver',7);
 if(form.currentWeeklyVol==null||form.currentWeeklyVol===''||!Number.isFinite(Number(form.currentWeeklyVol))||Number(form.currentWeeklyVol)<0)add('currentWeeklyVol','Volume semanal atual (use 0 se não treina)',7);
 if(['corrida','triatlo'].includes(form.modality)&&form.runStructure==='distancia'&&!runThreshold(form))add('runThresholdPace','Pace de limiar necessário para prescrever por km',4);
 const sports=form.modality==='triatlo'?['corrida','ciclismo','natacao']:['corrida','ciclismo','natacao'].includes(form.modality)?[form.modality]:[];
 for(const sport of sports)if(form.planningPreferences?.recentMinutes?.[sport]==null)add('planningPreferences.recentMinutes.'+sport,'Volume semanal recente de '+sport+' (min; use 0 se não pratica)',7);
 if(form.modality==='corrida'&&form.trainingGoal==='42k'&&!(Number(form.planningPreferences?.recentLongRunMinutes)>0))add('planningPreferences.recentLongRunMinutes','Duração do maior longão recente (min)',7);
 return fields;
}
