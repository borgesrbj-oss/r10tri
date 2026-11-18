export function missingAssessmentFields(form:Record<string,any>) {
 const fields:{field:string;label:string;step:number}[]=[];
 const add=(field:string,label:string,step:number)=>fields.push({field,label,step});
 if(!form.modality)add('modality','Modalidade',0);
 if(!form.level)add('level','Nível de experiência',1);
 if(['triatlo','natacao'].includes(form.modality)&&form.canSwim==null)add('canSwim','Informe se sabe nadar',2);
 if(!form.birthDate)add('birthDate','Data de nascimento',4);
 if(!(Number(form.currentWeight)>0))add('currentWeight','Peso atual',4);
 if(!Array.isArray(form.availableDays)||!form.availableDays.length)add('availableDays','Dias disponíveis',7);
 if(!(Number(form.weeklyHours)>0))add('weeklyHours','Horas disponíveis por semana',7);
 if(form.currentWeeklyVol==null||form.currentWeeklyVol===''||!Number.isFinite(Number(form.currentWeeklyVol))||Number(form.currentWeeklyVol)<0)add('currentWeeklyVol','Volume semanal atual (use 0 se não treina)',7);
 return fields;
}
