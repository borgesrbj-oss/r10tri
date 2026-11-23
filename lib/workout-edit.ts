import { buildWorkoutStructure, distributionForSteps, readWorkoutStructure } from './training-structure';
import {markRunningThreshold} from './training-audit';
import { targetForZone } from './training-zones';
import type { TrainingProfile, TrainingModality, TrainingZone } from './training-types';
export function editWorkoutStructure(input:unknown, minutes:number, modality:TrainingModality, zone:TrainingZone|null, profile:TrainingProfile|null) {
  const original=readWorkoutStructure(input);
  if(!original)throw new Error('Estrutura inválida; revise os blocos antes de editar.');
  if(!Number.isInteger(minutes)||minutes<4||minutes>1440)throw new Error('A sessão estruturada deve ter de 4 a 1.440 minutos.');
  if(modality!==original.modality) {
    const replacement=buildWorkoutStructure(profile,modality,original.phase,minutes,0);
    return {...replacement,requiresCoachReview:true,warnings:[...replacement.warnings,'Modalidade alterada manualmente: revisar especificidade, recuperação e distribuição semanal antes de executar.']};
  }
  const total=minutes*60;
  if(total<original.steps.length)throw new Error('Duração insuficiente para preservar os blocos.');
  const sizes=original.steps.map(step=>step.durationSeconds/original.durationSeconds*(total-original.steps.length));
  const durations=sizes.map(value=>Math.floor(value)+1);
  let remainder=total-durations.reduce((sum,value)=>sum+value,0);
  const ranking=sizes.map((size,index)=>({index,fraction:size%1})).sort((a,b)=>b.fraction-a.fraction);
  for(const item of ranking)if(remainder-->0)durations[item.index]++;
  const steps=original.steps.map((step,index)=>{
    const updated={...step,durationSeconds:durations[index]};
    if(zone && step.kind==='principal' && step.rest!=='passivo') {updated.zone=zone;updated.target=targetForZone(original.prescriptionMode==='distancia'?{...profile,runStructure:'distancia'}:profile,modality,zone);}
    if(original.prescriptionMode==='distancia'&&updated.rest!=='passivo'){if(updated.target.unit!=='s/km')throw new Error('Informe pace de limiar para preservar a corrida por km.');updated.distanceMeters=Math.max(10,Math.round(updated.durationSeconds/((updated.target.low+updated.target.high)/2)*100)*10);}else delete updated.distanceMeters;
    return updated;
  });
  const result={...original,durationSeconds:total,steps,distribution:distributionForSteps(steps,modality),requiresCoachReview:true,warnings:[...original.warnings,'Sessão editada manualmente: blocos redimensionados proporcionalmente; revisar alvos, recuperação e distribuição semanal antes de executar.']};
  if(profile){delete result.thresholdReference;markRunningThreshold(result,profile);}
  return result;
}
