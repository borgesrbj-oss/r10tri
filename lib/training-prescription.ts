import type {TrainingStep,WorkoutStructure} from './training-types';
export function distanceLabel(meters:number):string {
  return (meters/1000).toLocaleString('pt-BR',{maximumFractionDigits:2})+' km';
}
export function distancePrescribed(structure:WorkoutStructure,step:TrainingStep):boolean {
  return structure.prescriptionMode==='distancia' && step.rest!=='passivo' && Number(step.distanceMeters)>0;
}
export function prescribedDistance(structure:WorkoutStructure):number {
  return structure.steps.reduce((sum,step)=>sum+(distancePrescribed(structure,step)?Number(step.distanceMeters):0),0);
}
export function stepPrescription(structure:WorkoutStructure,step:TrainingStep,timeLabel:(seconds:number)=>string):string {
  return distancePrescribed(structure,step)?`${distanceLabel(step.distanceMeters!)} (tempo estimado ${timeLabel(step.durationSeconds)})`:timeLabel(step.durationSeconds);
}

/** Resumo de volume usado nas listas; o detalhe continua sendo validado pelo leitor. */
export function workoutPrescription(workout:{duration?:number|null;structure?:unknown}):string {
  const value=workout.structure as WorkoutStructure|null;
  const distance=value?.prescriptionMode==='distancia'&&Array.isArray(value.steps)&&value.steps.every(step=>step&&typeof step==='object'&&(step.rest==='passivo'||(Number.isFinite(step.distanceMeters)&&Number(step.distanceMeters)>0)))?prescribedDistance(value):0;
  return distance>0?`${distanceLabel(distance)} · ~${workout.duration??0} min`:`${workout.duration??0} min`;
}
