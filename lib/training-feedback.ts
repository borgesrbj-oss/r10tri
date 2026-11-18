/** Regras transparentes de apoio ao treinador; limiares operacionais, sem diagnóstico. */
export interface FeedbackLog { completedAt: Date | string; actualDuration?: number | null; rpe?: number | null; sleepHours?: number | null; fatigueScore?: number | null; painScore?: number | null }
export interface FeedbackWorkout { date: Date | string; completed?: boolean }
export interface TrainingFeedback { status: 'revisar'|'reduzir'|'manter'|'progredir'; reasons: string[]; observedSessions: number; initialFactor: number; highFraction: number; growth: number }
export function trainingFeedback(logs: FeedbackLog[] = [], workouts: FeedbackWorkout[] = [], now = new Date()): TrainingFeedback {
  const recent = logs.filter(log => { const age = now.getTime()-new Date(log.completedAt).getTime(); return age>=0 && age<=7*86400000; }).sort((a,b)=>new Date(b.completedAt).getTime()-new Date(a.completedAt).getTime());
  const reasons: string[]=[];
  const latest=recent[0];
  const localDay=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const missed=workouts.filter(workout=>!workout.completed && new Date(workout.date).toISOString().slice(0,10)<localDay && new Date(workout.date).getTime()>=now.getTime()-7*86400000).length;
  const result=(status:TrainingFeedback['status'],initialFactor:number,highFraction:number,growth:number):TrainingFeedback=>({status,reasons,initialFactor,highFraction,growth,observedSessions:recent.length});
  if (recent.some(log=>(log.painScore??0)>0)) { reasons.push('Dor relatada nos últimos sete dias: suspender intensidade automática e conversar com o treinador; o app não diagnostica nem libera retorno.'); return result('revisar',.65,0,0); }
  if (latest && ((latest.fatigueScore??0)>=8 || (latest.sleepHours!=null && latest.sleepHours<6))) { reasons.push('Fadiga alta ou sono insuficiente no último check-in: reduzir a primeira semana e priorizar recuperação.'); return result('reduzir',.75,0,0); }
  if (missed>=2) { reasons.push(`${missed} sessões não concluídas nos últimos sete dias: manter/reduzir carga inicial; nenhuma falta será compensada por treino intenso acumulado.`); return result('manter',.85,.1,0); }
  const observedDays=new Set(recent.map(log=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(log.completedAt))));
  if(observedDays.size>=3 && recent.every(log=>log.painScore===0 && log.fatigueScore!=null && log.fatigueScore<=4 && log.sleepHours!=null && log.sleepHours>=7 && log.rpe!=null && log.rpe<=7)) { reasons.push('Check-ins em pelo menos três dias recentes indicam boa tolerância; progressão limitada e sujeita à reavaliação semanal.'); return result('progredir',1,.2,.05); }
  reasons.push('Evidência de recuperação ainda insuficiente: não aumentar automaticamente a carga por ausência de relatos. Reavaliar após uma semana.');
  return result('manter',1,.2,0);
}
