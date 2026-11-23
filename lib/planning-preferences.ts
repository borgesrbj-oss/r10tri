export const DAYS=['seg','ter','qua','qui','sex','sab','dom'] as const;
export const SESSION_LABELS:Record<string,string>={tiros:'Tiros',rodagem:'Rodagem leve',longo:'Longo',ritmo:'Ritmo',brick:'Brick bike → corrida',natacao:'Natação',forca:'Força',descanso:'Descanso reservado'};
export interface PlanningPreferences { recentLongRunMinutes?:number; recentLongRunKm?:number; preferred?:Record<string,string[]>; doubleDays?:string[]; maxSessionMinutes?:number; recentMinutes?:Record<string,number> }
export function preferences(value:unknown):PlanningPreferences {
 return value&&typeof value==='object'&&!Array.isArray(value)?value as PlanningPreferences:{};
}
export function preferredDay(value:unknown,kind:string,day:string){return preferences(value).preferred?.[kind]?.includes(day)??false;}
export function dayKey(date:Date|string){return ['dom','seg','ter','qua','qui','sex','sab'][new Date(date).getUTCDay()];}
export function inferRaceGoal(modality:string,distance:unknown){
 const key=String(distance??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\s]/g,'');
 if(modality==='triatlo')return ({supersprint:'supersprint',sprint:'sprint',olimpico:'olimpica',olimpica:'olimpica','70.3':'70.3',half:'70.3',ironman:'ironman',full:'ironman'} as Record<string,string>)[key]??null;
 if(modality==='corrida')return ({'5k':'5k','5km':'5k','10k':'10k','10km':'10k','15k':'15k','15km':'15k','21k':'21k','21km':'21k','21.1km':'21k','42k':'42k','42km':'42k','42.2km':'42k'} as Record<string,string>)[key]??null;
 return null;
}
