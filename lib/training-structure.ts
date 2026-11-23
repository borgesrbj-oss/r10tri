import {recentLongRunLimit,markRunningThreshold} from './training-audit';
import {distanceLabel,prescribedDistance,stepPrescription} from './training-prescription';
import { effortTarget, numericValue, runThreshold, targetForZone, thresholdWarnings } from './training-zones';
import { trainingFeedback, type TrainingFeedback } from './training-feedback';
import { parseRaceTime, predictRaceTime } from './race-prediction';
import { preferences,preferredDay,dayKey,inferRaceGoal } from './planning-preferences';
import type { GeneratedWorkout, StructuredPlan, TrainingDistribution, TrainingModality, TrainingPhase, TrainingProfile, TrainingRace, TrainingStep, TrainingWeekSummary, TrainingZone, WorkoutStructure } from './training-types';

const DAY_MS = 86_400_000;
const DAYS: Record<string, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };
const LABEL: Record<TrainingModality, string> = { corrida: 'Corrida', ciclismo: 'Ciclismo', natacao: 'Natação', forca: 'Força e mobilidade' };
const PHASE_LABEL: Record<TrainingPhase, string> = { base: 'Base', build: 'Build', peak: 'Peak', race: 'Race', transition: 'Transition' };

export function emptyDistribution(): TrainingDistribution {
  return { lowSeconds: 0, moderateSeconds: 0, highSeconds: 0, restSeconds: 0, enduranceSeconds: 0, strengthSeconds: 0, totalSeconds: 0, highFraction: 0 };
}

export function combineDistributions(values: TrainingDistribution[]): TrainingDistribution {
  const total = emptyDistribution();
  for (const value of values) {
    total.lowSeconds += value.lowSeconds;
    total.moderateSeconds += value.moderateSeconds;
    total.highSeconds += value.highSeconds;
    total.restSeconds += value.restSeconds;
    total.strengthSeconds += value.strengthSeconds;
    total.totalSeconds += value.totalSeconds;
  }
  total.enduranceSeconds = total.lowSeconds + total.moderateSeconds + total.highSeconds;
  total.highFraction = total.enduranceSeconds ? total.highSeconds / total.enduranceSeconds : 0;
  return total;
}

export function distributionForSteps(steps: TrainingStep[], modality: TrainingModality): TrainingDistribution {
  const total = emptyDistribution();
  for (const step of steps) {
    total.totalSeconds += step.durationSeconds;
    if (modality === 'forca') total.strengthSeconds += step.durationSeconds;
    else if (step.rest === 'passivo' || step.zone == null) total.restSeconds += step.durationSeconds;
    else if (step.zone === 'Z1' || step.zone === 'Z2') total.lowSeconds += step.durationSeconds;
    else if (step.zone === 'Z3') total.moderateSeconds += step.durationSeconds;
    else total.highSeconds += step.durationSeconds;
  }
  total.enduranceSeconds = total.lowSeconds + total.moderateSeconds + total.highSeconds;
  total.highFraction = total.enduranceSeconds ? total.highSeconds / total.enduranceSeconds : 0;
  return total;
}

/** Datas do calendário usam meio-dia UTC para não mudar de dia por fuso/DST. */
export function calendarDay(value: string | Date): Date | null {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
  }
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 12)) : null;
}

function phaseForDate(date: Date, start: Date, race: Date | null): TrainingPhase {
  if (race) {
    const before = Math.round((race.getTime() - date.getTime()) / DAY_MS);
    if (before < 0) return before >= -14 ? 'transition' : 'base';
    if (before <= 7) return 'race';
    if (before <= 21) return 'peak';
    if (before <= 70) return 'build';
    return 'base';
  }
  return date.getTime() - start.getTime() < 42 * DAY_MS ? 'base' : 'build';
}

function appendStep(steps: TrainingStep[], profile: TrainingProfile | null, modality: TrainingModality, kind: TrainingStep['kind'], label: string, seconds: number, zone: TrainingZone | null, rest: TrainingStep['rest'] = null) {
  if (seconds <= 0) return;
  const target = zone ? targetForZone(profile, modality, zone) : { ...effortTarget('Z1', 'Repouso passivo entre repetições.'), low: 0, high: 0, text: 'Repouso passivo; retome somente quando confortável.' };
  const step: TrainingStep = { kind, label, durationSeconds: Math.round(seconds), zone, rest, target };
  if ((target.unit === 's/km' || target.unit === 's/100m') && rest !== 'passivo' && (modality !== 'corrida' || profile?.runStructure !== 'zona')) {
    const unit = target.unit === 's/km' ? 1000 : 100;
    const estimate = step.durationSeconds / ((target.low + target.high) / 2) * unit;
    const pool = profile?.poolSize === '50m' ? 50 : 25;
    const rounding = modality === 'natacao' ? pool : 10;
    const meters = Math.round(estimate / rounding) * rounding;
    if (meters > 0) step.distanceMeters = meters;
  }
  steps.push(step);
}

function intervalSettings(modality: TrainingModality, zone: TrainingZone, kind='aerobico') {
  if(modality==='corrida'&&kind==='fartlek')return {chunk:60,rest:120,maximum:15*60};
  if(modality==='corrida'&&kind==='ritmo')return {chunk:600,rest:120,maximum:30*60};
  if (modality === 'natacao') return { chunk: zone === 'Z5' ? 90 : 180, rest: 20, maximum: zone === 'Z5' ? 12 * 60 : 30 * 60 };
  if (modality === 'ciclismo') return { chunk: zone === 'Z5' ? 180 : 480, rest: zone === 'Z5' ? 180 : 180, maximum: zone === 'Z5' ? 25 * 60 : 45 * 60 };
  return { chunk: zone === 'Z5' ? 180 : 360, rest: zone === 'Z5' ? 150 : 120, maximum: zone === 'Z5' ? 20 * 60 : 36 * 60 };
}

function framing(duration: number) {
  return { warm: Math.max(60, Math.min(600, Math.round(duration * 0.15))), cool: Math.max(60, Math.min(480, Math.round(duration * 0.1))) };
}

function requiredTime(high: number, duration: number, modality: TrainingModality, zone: TrainingZone,kind='aerobico'): number {
  const { warm, cool } = framing(duration);
  const settings = intervalSettings(modality, zone,kind);
  const repetitions = Math.max(1, Math.ceil(high / settings.chunk));
  return warm + cool + high + Math.max(0, repetitions - 1) * settings.rest;
}

export function highCapacitySeconds(duration: number, modality: TrainingModality, zone: TrainingZone = 'Z4',kind='aerobico'): number {
  if (modality === 'forca' || duration < 25 * 60) return 0;
  const maximum = Math.min(intervalSettings(modality, zone,kind).maximum, duration);
  let capacity = 0;
  for (let high = 30; high <= maximum; high += 30) {
    if (requiredTime(high, duration, modality, zone,kind) <= duration) capacity = high;
  }
  return capacity;
}

export function buildWorkoutStructure(profile: TrainingProfile | null, modality: TrainingModality, phase: TrainingPhase, minutes: number, highSeconds = 0, highZone: TrainingZone = 'Z4', easyZone: TrainingZone = 'Z2', kind='aerobico'): WorkoutStructure {
  if (!Number.isInteger(minutes) || minutes < 4 || minutes > 1440) throw new Error('Duração inválida para estruturar a sessão.');
  const duration = minutes * 60;
  const steps: TrainingStep[] = [];
  const warnings = thresholdWarnings(profile, modality);
  const { warm, cool } = framing(duration);
  if (modality === 'forca') {
    appendStep(steps, profile, modality, 'aquecimento', 'Mobilidade leve orientada', warm, 'Z1');
    const rest = Math.max(30, Math.round(duration * 0.1));
    appendStep(steps, profile, modality, 'principal', 'Técnica e força conforme orientação do treinador', duration - warm - cool - rest, 'Z2');
    appendStep(steps, profile, modality, 'recuperacao', 'Pausas entre séries e avaliação de conforto', rest, null, 'passivo');
    appendStep(steps, profile, modality, 'desaquecimento', 'Mobilidade leve e retorno à calma', cool, 'Z1');
  } else {
    const high = Math.min(Math.max(0, Math.floor(highSeconds / 30) * 30), highCapacitySeconds(duration, modality, highZone,kind));
    appendStep(steps, profile, modality, 'aquecimento', 'Aquecimento progressivo e confortável', warm, 'Z1');
    if (high > 0) {
      const settings = intervalSettings(modality, highZone,kind);
      const count = Math.ceil(high / settings.chunk);
      const each = Math.floor(high / count);
      let allocated = 0;
      for (let index = 0; index < count; index++) {
        const seconds = index === count - 1 ? high - allocated : each;
        appendStep(steps, profile, modality, 'principal', kind==='fartlek'?`Fartlek ${index+1}/${count}: trecho rápido controlado`:kind==='ritmo'?`Ritmo sustentado ${index+1}/${count}`:modality==='corrida'?`Tiro ${index+1}/${count} controlado`:`Bloco ${index+1}/${count} controlado`, seconds, highZone);
        allocated += seconds;
        if (index < count - 1) appendStep(steps, profile, modality, 'recuperacao', kind==='fartlek'?`Fartlek ${index+1}/${count-1}: trecho leve em movimento`:`Recuperação ${index + 1}/${count - 1}`, settings.rest, modality === 'natacao' ? null : 'Z1', modality === 'natacao' ? 'passivo' : 'ativo');
      }
      const used = steps.reduce((sum, step) => sum + step.durationSeconds, 0);
      appendStep(steps, profile, modality, 'principal', 'Complemento aeróbico confortável', duration - used - cool, 'Z2');
      // Um único bloco também tem recuperação explícita, dentro do tempo já reservado.
      if (count === 1) {
        const last = steps[steps.length - 1];
        const recovery = Math.min(60, last?.label === 'Complemento aeróbico confortável' ? last.durationSeconds : 0);
        if (recovery > 0) {
          last.durationSeconds -= recovery;
          if (last.durationSeconds === 0) steps.pop();
          appendStep(steps, profile, modality, 'recuperacao', 'Recuperação ativa após o bloco', recovery, 'Z1', 'ativo');
        }
      }
    } else {
      const recovery = Math.max(30, Math.round(duration * 0.1));
      let remaining=duration-warm-cool-recovery, repetition=1;
      const returning=modality==='corrida' && (Number(profile?.currentWeeklyVol)===0 || preferences(profile?.planningPreferences).recentMinutes?.corrida===0 || (profile?.inactivityWeeks??0)>=4 || profile?.trainingGoal==='retorno');
      const technique=modality==='natacao' && (kind==='tecnica' || preferences(profile?.planningPreferences).recentMinutes?.natacao===0 || profile?.swimLevel==='basico' || profile?.level==='iniciante' || profile?.trainingGoal==='tecnica');
      if(returning || technique) while(remaining>0) {
        const active=Math.min(returning?60:120,remaining);
        appendStep(steps,profile,modality,'principal',returning?`Ciclo ${repetition}: trote confortável; caminhe se necessário`:`Série ${repetition}: respiração e alinhamento, nado fácil em piscina supervisionada`,active,'Z1'); remaining-=active;
        const rest=Math.min(returning?120:20,remaining);
        appendStep(steps,profile,modality,'recuperacao',returning?`Caminhada ${repetition++}`:`Pausa ${repetition++} na borda`,rest,returning?'Z1':null,returning?'ativo':'passivo'); remaining-=rest;
      }
      else if(modality==='ciclismo'&&kind==='cadencia') {
        for(let i=0;i<3;i++) {const seconds=Math.floor(remaining/(3-i));appendStep(steps,profile,modality,'principal',`Cadência ${i+1}/3: ${i%2===0?'giro confortável e fluido, sem saltar no selim':'voltar à cadência espontânea'}; sem aumentar potência`,seconds,'Z2');remaining-=seconds;}
      } else appendStep(steps, profile, modality, 'principal', kind==='longo'?'Longo aeróbico: duração sustentável, hidratação e logística previamente combinadas':kind==='brick'?'Transição bike → corrida: controle de técnica e esforço, sem buscar velocidade':'Bloco aeróbico contínuo e controlado', remaining, kind==='recuperacao'?'Z1':easyZone);
      appendStep(steps, profile, modality, 'recuperacao', 'Recuperação ativa confortável', recovery, 'Z1', 'ativo');
    }
    appendStep(steps, profile, modality, 'desaquecimento', 'Desaquecimento e retorno à calma', cool, 'Z1');
  }
  for(const step of steps) if(step.distanceMeters && ['s/km','s/100m'].includes(step.target.unit)) {
    const unit=step.target.unit==='s/km'?1000:100, rounding=modality==='natacao'?(profile?.poolSize==='50m'?50:25):10;
    const meters=Math.round(step.durationSeconds/((step.target.low+step.target.high)/2)*unit/rounding)*rounding;
    if(meters>0)step.distanceMeters=meters; else delete step.distanceMeters;
  }
  const distribution = distributionForSteps(steps, modality);
  return { version: 1, ...(modality==='corrida'&&profile?.runStructure==='distancia'&&runThreshold(profile)?{prescriptionMode:'distancia' as const}:{}), modality, phase, durationSeconds: distribution.totalSeconds, steps, distribution, warnings, requiresCoachReview: false };
}

export function durationLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60), remaining = seconds % 60;
  return `${minutes ? `${minutes} min` : ''}${minutes && remaining ? ' ' : ''}${remaining ? `${remaining} s` : ''}` || '0 s';
}

export function describeStructure(structure: WorkoutStructure): string {
  const lines = structure.steps.map((step, index) => `${index + 1}. ${step.label}: ${stepPrescription(structure,step,durationLabel)} · ${step.zone || 'repouso'} · ${step.target.text}${step.distanceMeters && structure.prescriptionMode!=='distancia' ? ` · distância estimada ${step.distanceMeters} m` : ''}.`);
  lines.unshift(`Objetivo: ${structure.distribution.highSeconds+structure.distribution.moderateSeconds>0 ? 'estimular capacidade aeróbica com blocos fortes controlados e recuperação' : structure.modality==='forca' ? 'desenvolver força e controle do movimento com orientação' : 'desenvolver resistência aeróbica e consistência em baixo esforço'}. Justificativa: ${structure.phase==='transition' ? 'recuperar após a competição' : 'distribuir o estímulo dentro da fase e do tempo disponível'}.`);
  if(structure.prescriptionMode==='distancia')lines.unshift(`Prescrição por distância: ${distanceLabel(prescribedDistance(structure))}. Distâncias calculadas a partir do pace de limiar; os tempos são estimativas de planejamento. Respeite o tempo disponível e interrompa se necessário.`);
  lines.push(`Total: ${durationLabel(structure.durationSeconds)}. A duração inclui aquecimento, recuperações e desaquecimento.`);
  if (structure.modality !== 'forca') lines.push(`Tempo aeróbico ativo: ${durationLabel(structure.distribution.enduranceSeconds)}; Z1–Z2 ${durationLabel(structure.distribution.lowSeconds)}, Z3 ${durationLabel(structure.distribution.moderateSeconds)}, Z4–Z5 ${durationLabel(structure.distribution.highSeconds)}. Repouso passivo não entra na distribuição.`);
  else lines.push('Força não é contabilizada como volume aeróbico. Exercícios e cargas devem ser definidos pelo treinador, especialmente diante de dor ou restrição.');
  if (structure.warnings.length) lines.push(...structure.warnings.map(warning => `Atenção: ${warning}`));
  lines.push(`Percepção de esforço (0–10): ${[...new Set(structure.steps.filter(step=>step.zone).map(step=>{const target=effortTarget(step.zone!);return `${step.zone}: ${target.low}–${target.high}`;}))].join('; ')}. Faixas operacionais, sem equivalência fisiológica exata. Reduza ou interrompa se houver dor, tontura ou mal-estar e procure orientação apropriada.`);
  if (structure.requiresCoachReview) lines.unshift('PLANO PARA REVISÃO DO TREINADOR: não representa liberação para treinar.');
  return lines.join('\n');
}

/** Lê JSON persistido sem confiar em somatórios ou campos fornecidos pelo cliente. */
export function readWorkoutStructure(input: unknown): WorkoutStructure | null {
  let value: unknown = input;
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { return null; } }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.version !== 1 || typeof record.modality !== 'string' || typeof record.phase !== 'string' || !Object.prototype.hasOwnProperty.call(LABEL, record.modality) || !Object.prototype.hasOwnProperty.call(PHASE_LABEL, record.phase)) return null;
  if (!Number.isInteger(record.durationSeconds) || Number(record.durationSeconds) < (record.origin==='coach'?60:240) || Number(record.durationSeconds) > DAY_MS / 1000 || !Array.isArray(record.steps) || record.steps.length < (record.origin==='coach'?1:3) || record.steps.length > 400) return null;
  if(record.prescriptionMode!==undefined && record.prescriptionMode!=='distancia')return null;
  if(record.thresholdReference!=null){const ref=record.thresholdReference as Record<string,unknown>;if(!['run_threshold','threshold_hr','ftp','css'].includes(String(ref.basis))||typeof ref.value!=='number'||!Number.isFinite(ref.value)||ref.value<=0)return null;}
  const steps: TrainingStep[] = [];
  for (const item of record.steps) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const step = item as Record<string, unknown>;
    if (!['aquecimento', 'principal', 'recuperacao', 'desaquecimento'].includes(String(step.kind)) || !Number.isInteger(step.durationSeconds) || Number(step.durationSeconds) <= 0 || typeof step.label !== 'string' || step.label.length > 500) return null;
    if (step.zone !== null && (typeof step.zone !== 'string' || !['Z1', 'Z2', 'Z3', 'Z4', 'Z5'].includes(step.zone))) return null;
    if (step.rest !== null && !['ativo', 'passivo'].includes(String(step.rest))) return null;
    const target = step.target as Record<string, unknown> | null;
    if (!target || !['ftp', 'run_threshold', 'threshold_hr', 'css', 'rpe'].includes(String(target.basis)) || !['W', 's/km', 'bpm', 's/100m', 'RPE'].includes(String(target.unit)) || typeof target.low !== 'number' || typeof target.high !== 'number' || !Number.isFinite(target.low) || !Number.isFinite(target.high) || target.low < 0 || target.high < target.low || typeof target.text !== 'string' || typeof target.source !== 'string' || target.text.length > 1000 || target.source.length > 1000) return null;
    const units: Record<string, string> = { ftp: 'W', run_threshold: 's/km', threshold_hr: 'bpm', css: 's/100m', rpe: 'RPE' };
    if (target.unit === 'bpm' && (target.low < 1 || target.high > 250)) return null;
    if (units[String(target.basis)] !== target.unit || (target.unit === 'RPE' && target.high > 10) || (target.unit === 'W' && target.high > 2000) || ((target.unit === 's/km' || target.unit === 's/100m') && target.high > 3600)) return null;
    if (step.distanceMeters != null && (typeof step.distanceMeters !== 'number' || !Number.isFinite(step.distanceMeters) || step.distanceMeters <= 0)) return null;
    steps.push({ kind: step.kind as TrainingStep['kind'], label: step.label, durationSeconds: Number(step.durationSeconds), zone: step.zone as TrainingStep['zone'], rest: step.rest as TrainingStep['rest'], target: { basis: target.basis as TrainingStep['target']['basis'], unit: target.unit as TrainingStep['target']['unit'], low: target.low, high: target.high, text: target.text, source: target.source }, ...(typeof step.distanceMeters === 'number' ? { distanceMeters: step.distanceMeters } : {}) });
  }
  if (record.origin!=='coach' && (!steps.some(step => step.kind === 'aquecimento') || !steps.some(step => step.kind === 'principal') || !steps.some(step => step.kind === 'desaquecimento'))) return null;
  if(record.prescriptionMode==='distancia' && (record.modality!=='corrida'||steps.some(step=>step.rest!=='passivo'&&(!step.distanceMeters||step.target.unit!=='s/km'))))return null;
  const modality = record.modality as TrainingModality;
  const distribution = distributionForSteps(steps, modality);
  if (distribution.totalSeconds !== record.durationSeconds) return null;
  return { version: 1,...(record.thresholdReference?{thresholdReference:record.thresholdReference as WorkoutStructure['thresholdReference']}:{}),...(record.prescriptionMode==='distancia'?{prescriptionMode:'distancia' as const}:{}),...(record.origin==='coach'?{origin:'coach' as const}:{}), modality, phase: record.phase as TrainingPhase, durationSeconds: Number(record.durationSeconds), steps, distribution, warnings: Array.isArray(record.warnings) ? record.warnings.filter((warning): warning is string => typeof warning === 'string').slice(0, 50) : [], requiresCoachReview: record.requiresCoachReview === true };
}

function hasReportedCondition(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return Boolean(normalized) && !/^(nao|nenhum|nenhuma|sem|nenhuma lesao|sem lesao|sem lesoes|sem restricoes|nao tenho)[.!]?$/.test(normalized);
}

function safetyPolicy(profile: TrainingProfile | null, start: Date) {
  const warnings: string[] = [];
  let review = false;
  if (hasReportedCondition(profile?.currentInjuries) || hasReportedCondition(profile?.medicalConditions) || hasReportedCondition(profile?.limitations)) {
    review = true;
    warnings.push('Lesão atual, condição de saúde ou limitação informada: intensidade automática suspensa; o treinador deve revisar o plano e orientar avaliação profissional quando indicada.');
  }
  if (hasReportedCondition(profile?.injuryHistory)) warnings.push('Histórico de lesão informado: revisar tolerância e progressão com o treinador; o sistema não prescreve tratamento.');
  const birth = profile?.birthDate ? calendarDay(profile.birthDate) : null;
  if (birth && (start.getTime() - birth.getTime()) / DAY_MS / 365.2425 < 18) {
    review = true;
    warnings.push('Atleta menor de 18 anos: intensidade requer planejamento individual e supervisão profissional.');
  }
  const max = numericValue(profile?.maxHeartRate), rest = numericValue(profile?.restingHeartRate), threshold = numericValue(profile?.thresholdHeartRate);
  if ((max && rest && rest >= max) || (max && threshold && threshold > max)) warnings.push('Frequências cardíacas inconsistentes; confirme os valores. Não foi calculada FC máxima pela idade.');
  if (!profile?.birthDate) warnings.push('Data de nascimento não informada: complete a triagem para revisão do treinador.');
  if (!numericValue(profile?.currentWeight)) warnings.push('Peso não informado; nenhuma massa corporal padrão foi presumida.');
  return { review, warnings };
}

interface SessionDraft { date: Date; modality: TrainingModality; minutes: number; phase: TrainingPhase; high: number; highZone: TrainingZone; kind?:string }

function allocateMinutes(drafts: SessionDraft[], budget: number, level: string, goal?: string | null, daily?: unknown, options?:unknown, week=0, growth=0): SessionDraft[] {
  const prefs=preferences(options);
  const perDay = level === 'iniciante' ? 90 : level === 'avancado' ? 360 : 240;
  const limits = daily && typeof daily==='object' && !Array.isArray(daily) ? daily as Record<string,unknown> : {};
  const dayCap=(draft:SessionDraft)=>{const key=Object.keys(DAYS).find(day=>DAYS[day]===draft.date.getUTCDay())!; const limit=numericValue(limits[key]); const cap=limit==null?perDay:Math.min(perDay,Math.max(0,limit));return draft.kind==='longo'&&draft.modality==='corrida'?Math.min(cap,recentLongRunLimit(options,week,growth,draft.phase,week%4===3)):cap;};
  const chosen:SessionDraft[]=[];
  const recentCap=(modality:string)=>prefs.recentMinutes?.[modality]==null?Infinity:Math.max(20,Math.floor(prefs.recentMinutes[modality]*Math.pow(1+growth,week)));
  for(const draft of drafts) if(chosen.length<Math.floor(budget/10) && chosen.filter(item=>item.modality===draft.modality).length*10+10<=recentCap(draft.modality) && chosen.filter(item=>item.date.getTime()===draft.date.getTime()).length<(prefs.doubleDays===undefined?4:prefs.doubleDays.includes(dayKey(draft.date))?2:1) && chosen.filter(item=>item.date.getTime()===draft.date.getTime()).length*10+10<=dayCap(draft))chosen.push(draft);
  const maximum: Record<TrainingModality, number> = level === 'iniciante'
    ? { corrida: 40, ciclismo: 75, natacao: 40, forca: 25 }
    : level === 'avancado' ? { corrida: 150, ciclismo: 300, natacao: 120, forca: 45 } : { corrida: 120, ciclismo: 240, natacao: 90, forca: 40 };
  const weights: Record<TrainingModality, number> = { corrida: 1.15, ciclismo: 1.6, natacao: 1, forca: 0.4 };
  const longGoal = ['15k', '21k', '42k', '70.3', 'ironman','endurance','aguas_abertas'].includes(goal || '');
  const lastDay = Math.max(...chosen.filter(draft => draft.modality !== 'forca').map(draft => draft.date.getTime()));
  const weight = (draft: SessionDraft) => weights[draft.modality] * ((draft.kind==='longo'||(draft.kind==='brick'&&draft.modality==='ciclismo'&&preferredDay(prefs,'longo',dayKey(draft.date))))?2:longGoal && !prefs.preferred?.longo?.length && draft.date.getTime() === lastDay && ['corrida', 'ciclismo'].includes(draft.modality) ? 1.6 : 1);
  for (const draft of chosen) draft.minutes = 10;
  let remaining = budget - chosen.length * 10;
  while (remaining > 0) {
    const available = chosen.filter(draft => draft.minutes < Math.min(maximum[draft.modality],prefs.maxSessionMinutes??480,draft.kind==='brick'&&draft.modality==='corrida'?(level==='iniciante'?10:Math.min(35,10+week*2)):480) && (prefs.recentMinutes?.[draft.modality]==null || chosen.filter(other=>other.modality===draft.modality).reduce((sum,other)=>sum+other.minutes,0)<Math.max(20,Math.floor(prefs.recentMinutes[draft.modality]*Math.pow(1+growth,week)))) && chosen.filter(other => other.date.getTime() === draft.date.getTime()).reduce((sum, other) => sum + other.minutes, 0) < dayCap(draft));
    if (!available.length) break;
    available.sort((a, b) => weight(b) / (b.minutes + 1) - weight(a) / (a.minutes + 1));
    available[0].minutes++;
    remaining--;
  }
  return chosen;
}

function withEnvironment(description: string, profile: TrainingProfile | null, draft: SessionDraft): string {
  const raw = draft.modality === 'ciclismo' ? profile?.bikeEnvByDay : draft.modality === 'corrida' ? profile?.runEnvByDay : null;
  if (!raw) return description;
  try {
    const key = Object.keys(DAYS).find(day => DAYS[day] === draft.date.getUTCDay());
    const environment = JSON.parse(raw)[key || ''];
    if (environment === 'esteira') return `${description}\nAmbiente informado: esteira. Ajuste velocidade e inclinação com seu treinador.`;
    if (environment === 'rolo') return `${description}\nAmbiente informado: rolo. Ajuste resistência e ventilação conforme equipamento.`;
    if (environment === 'rua') return `${description}\nAmbiente informado: rua. Considere terreno, clima, trânsito e segurança.`;
  } catch { /* Campo legado inválido não altera datas, zonas ou duração. */ }
  return description;
}

export function generateStructuredPlan(profile: TrainingProfile | null, races: TrainingRace[], daysAvail: string[], startDate?: string | Date | null, weeks?: number | string | null, feedback:TrainingFeedback=trainingFeedback()): StructuredPlan {
  const workouts: GeneratedWorkout[] = [];
  const warnings: string[] = [];
  const weekSummaries: TrainingWeekSummary[] = [];
  let requiresCoachReview = true;
  const calculation:{value?:StructuredPlan['summary']['calculation']}={};
  const result = (): StructuredPlan => ({ workouts, warnings: [...new Set(warnings)], summary: { calculation:calculation.value,basis: 'tempo_aerobico_ativo', targetHighFraction: 0.2, goal: profile?.trainingGoal || null, warnings: [...new Set(warnings)], requiresCoachReview, distribution: combineDistributions(workouts.map(workout => workout.structure.distribution)), weeks: weekSummaries } });
  const start = calendarDay(startDate ?? new Date());
  if (!start) { warnings.push('Data de início inválida.'); return result(); }
  const capacity = numericValue(profile?.weeklyHours);
  if (capacity == null || capacity <= 0 || capacity > 40) { warnings.push('Informe disponibilidade semanal maior que zero e de até 40 horas antes de gerar.'); return result(); }
  const budget = Math.floor(capacity * 60);
  const days = [...new Set((daysAvail || []).filter(day => Object.prototype.hasOwnProperty.call(DAYS, day)))];
  if (!days.length) { warnings.push('Selecione os dias disponíveis; nenhum dia foi presumido.'); return result(); }
  const requested = weeks == null ? null : numericValue(weeks);
  if (weeks != null && (requested == null || requested < 1 || requested > 52 || !Number.isInteger(requested))) { warnings.push('Escolha de 1 a 52 semanas completas.'); return result(); }
  const datedRaces = (races || []).map(race => ({ ...race, parsed: calendarDay(race.date) })).filter(race => race.parsed && race.parsed >= start).sort((a, b) => a.parsed!.getTime() - b.parsed!.getTime());
  const race = (datedRaces.find(item=>item.priority==='A') ?? datedRaces[0])?.parsed ?? null;
  if(datedRaces.some(item=>item.parsed!==race && Math.abs(item.parsed!.getTime()-(race?.getTime()??0))<14*DAY_MS))warnings.push('Competições próximas: revisar prioridade e recuperação com o coach, sem acumular carga.');
  const autoWeeks = race ? Math.max(1, Math.ceil((race.getTime() - start.getTime()) / DAY_MS / 7) + 2) : 12;
  if (requested == null && autoWeeks > 52) { warnings.push('A prova está além do horizonte de 52 semanas. Escolha uma duração explícita e reavalie o planejamento ao final do ciclo.'); return result(); }
  const totalWeeks = requested ?? autoWeeks;
  if (!race) warnings.push('Sem prova-alvo com data válida: plano de preparação, sem inventar uma semana de prova.');
  const safety = safetyPolicy(profile, start);
  requiresCoachReview = safety.review || feedback.status==='revisar';
  warnings.push(...safety.warnings,...feedback.reasons);
  const level = profile?.level || 'intermediario';
  const swimming = profile?.canSwim !== false && (profile?.hasPoolAccess !== false || profile?.poolSize === 'mar_aberto');
  const selected = profile?.modality || 'triatlo';
  const inferredGoal=inferRaceGoal(selected,(datedRaces.find(item=>item.priority==='A')??datedRaces[0])?.distance);
  if(!profile?.trainingGoal&&inferredGoal){profile={...profile,trainingGoal:inferredGoal};warnings.push('Foco derivado da distância cadastrada da prova prioritária; nenhum resultado fisiológico foi presumido.');}
  const goal = profile?.trainingGoal || null;
  const goalKm:Record<string,number>={'5k':5,'10k':10,'15k':15,'21k':21.0975,'42k':42.195};
  if(selected==='corrida' && goal && goalKm[goal] && profile?.goalTime) {
    const desired=parseRaceTime(profile.goalTime);
    if(!desired)warnings.push('Tempo-alvo em texto livre: informe m:ss ou h:mm:ss para comparar com o resultado recente. Nenhuma meta numérica foi presumida.');
    const estimate=predictRaceTime({...profile,targetDistanceKm:goalKm[goal]},start);
    if(desired && estimate.available && desired<estimate.seconds*.85) {requiresCoachReview=true;warnings.push('Meta de tempo mais de 15% abaixo da estimativa recente: referência de triagem do produto, não limite fisiológico. Rever prazo e objetivo com o coach.');}
  }
  const shortGoal = ['pace', '5k', '10k', 'supersprint', 'sprint','velocidade'].includes(goal || '');
  if(profile?.goalType==='completar')warnings.push('Objetivo de completar: teto operacional de intensidade reduzido a 10%, sem compensação; revisar com o coach. Não é prescrição universal.');
  if (goal) warnings.push(`Objetivo ${goal}: ${shortGoal ? 'blocos curtos de intensidade no Build/Peak' : 'prioridade de duração aeróbica na última sessão disponível e blocos sustentados'}. O volume continua limitado pela triagem; esta escolha não comprova prontidão para a prova.`);
  if (selected === 'corrida' && profile?.runStructure === 'distancia' && !runThreshold(profile)) warnings.push('Distâncias não estimadas: informe um limiar de pace. Os blocos permanecem por tempo e percepção.');
  const modalities: TrainingModality[] = selected === 'corrida' ? ['corrida'] : selected === 'ciclismo' ? ['ciclismo'] : selected === 'natacao' ? (swimming ? ['natacao'] : []) : (swimming ? ['natacao', 'ciclismo', 'corrida'] : ['ciclismo', 'corrida']);
  if (!swimming && (selected === 'triatlo' || selected === 'natacao')) warnings.push('Sem acesso à natação informado: nenhuma sessão de água foi criada; revise a logística com o treinador.');
  if (!modalities.length) return result();
  let schedule: Record<string, string[]> = {};
  try { schedule = typeof profile?.daySchedule === 'string' ? JSON.parse(profile.daySchedule) : profile?.daySchedule || {}; } catch { warnings.push('Agenda por modalidade inválida; revise a triagem.'); return result(); }
  if (schedule == null || Array.isArray(schedule) || typeof schedule !== 'object') { warnings.push('Agenda por modalidade inválida.'); return result(); }
  const explicit = Object.values(schedule).some(value => Array.isArray(value) && value.length > 0);
  const prefs=preferences(profile?.planningPreferences);
  for(const [kind,preferred]of Object.entries(prefs.preferred||{}))if(preferred.some(day=>!days.includes(day)))warnings.push(`Preferência ${kind} em dia indisponível ignorada. Disponibilidade e recuperação têm prioridade.`);
  const currentHours = numericValue(profile?.currentWeeklyVol);
  const returning=(profile?.inactivityWeeks??0)>=4 || goal==='retorno';
  const declaredMinutes=modalities.map(sport=>numericValue(prefs.recentMinutes?.[sport]));
  const declaredTotal=declaredMinutes.every(value=>value!=null)?declaredMinutes.reduce((sum,value)=>sum+(value??0),0):null;
  const reference = declaredTotal!=null&&declaredTotal>0&&!returning?Math.min(budget,Math.floor(declaredTotal)):currentHours != null && currentHours > 0 && !returning ? Math.min(budget, Math.floor(currentHours * 60)) : Math.min(budget, Math.floor(budget * 0.6), days.length * (level === 'iniciante' || returning ? 20 : 30));
  const initial=Math.floor(reference*feedback.initialFactor);
  if (currentHours == null || currentHours <= 0) warnings.push('Volume atual ausente ou zero: início conservador, sem presumir uma hora de treino. Confirme com o treinador.');
  const growth = requiresCoachReview || returning ? 0 : feedback.growth;
  if(returning)warnings.push('Retorno após afastamento: sessões reduzidas e corrida/caminhada; reavaliar tolerância antes de aumentar.');
  calculation.value={version:1,method:'Regras determinísticas auditáveis; sem pesquisa ou decisão de IA em tempo real',initialMinutes:initial,weeklyCapMinutes:budget,growth,inputs:{startDate:start.toISOString().slice(0,10),endDate:new Date(start.getTime()+(totalWeeks*7-1)*DAY_MS).toISOString().slice(0,10),modality:selected,level,goal,availableDays:days,recentMinutes:prefs.recentMinutes??null,recentLongRunMinutes:prefs.recentLongRunMinutes??null,dailyMinutes:profile?.dailyMinutes??null,raceDate:race?.toISOString().slice(0,10)??null,requiresCoachReview,feedbackStatus:feedback.status},rules:['Volume inicial = menor entre disponibilidade e volume recente declarado, vezes fator de feedback','Semana de recuperação a cada quatro semanas: 65% do orçamento','Peak: 75%; Race: 45%; Transition: 35% do orçamento','Carga, pausa e distribuição calculadas pela soma dos segundos de cada bloco','Limites e percentuais são regras operacionais, não resultados clínicos individuais','O relatório até/acima do limiar é calculado pelos alvos de cada bloco, sem converter PSE em limiar medido','Distribuição final pode divergir de 80/20 por adaptação, recuperação, restrição, tempo e referência de intensidade disponível'],sourceIds:['stoggl2015','ioc2016','baa','coggan','friel','css','daniels']};
  const requiredWeeks:Record<string,number>={'5k':6,'10k':8,'21k':12,'42k':level==='avancado'&&Number(prefs.recentMinutes?.corrida)>0&&Number(prefs.recentLongRunMinutes)>0?12:16,'70.3':16,ironman:24};
  if(goal && race && requiredWeeks[goal] && Math.ceil(((race.getTime()-start.getTime())/DAY_MS+1)/7)<requiredWeeks[goal]) {requiresCoachReview=true;warnings.push(`Prazo curto para ${goal}: referência operacional de ${requiredWeeks[goal]} semanas, sem garantia de prontidão. Rever meta e participação com o coach.`);}
  let lastQualityDay: number | null = null;
  let previousLoadBudget = initial;
  let previousPhase: TrainingPhase | null = null;
  for (let week = 0; week < totalWeeks; week++) {
    const weekStart = new Date(start.getTime() + week * 7 * DAY_MS);
    const weekEnd = new Date(weekStart.getTime() + 6 * DAY_MS);
    const weekPhase = phaseForDate(weekEnd, start, race);
    const recovery = week % 4 === 3 && weekPhase !== 'race' && weekPhase !== 'transition';
    const weekWarnings: string[] = [];
    if (previousPhase === 'transition' && weekPhase === 'base') previousLoadBudget = Math.min(previousLoadBudget, Math.floor(initial * 0.7));
    const normalBudget = week === 0 ? initial : Math.min(budget, Math.floor(previousLoadBudget * (1 + growth)));
    if (!recovery && weekPhase !== 'race' && weekPhase !== 'transition') previousLoadBudget = normalBudget;
    const reduction = weekPhase === 'transition' ? 0.35 : weekPhase === 'race' ? 0.45 : weekPhase === 'peak' ? 0.75 : recovery ? 0.65 : 1;
    const weekBudget = Math.min(budget, Math.max(0, Math.floor(normalBudget * reduction)));
    const drafts: SessionDraft[] = [];
    let index = week;
    for (let offset = 0; offset < 7; offset++) {
      const date = new Date(weekStart.getTime() + offset * DAY_MS);
      const key = Object.keys(DAYS).find(day => DAYS[day] === date.getUTCDay())!;
      if (!days.includes(key)) continue;
      if(!explicit&&days.length===7&&!prefs.preferred?.descanso?.length&&key==='seg'){weekWarnings.push('Segunda reservada para descanso na agenda automática de sete dias. Uma agenda explícita ou preferência de descanso tem prioridade.');continue;}
      if(preferredDay(prefs,'descanso',key)){weekWarnings.push('Descanso reservado respeitado; nenhuma falta será comprimida nos outros dias.');continue;}
      if (datedRaces.some(item=>item.parsed!.getTime()===date.getTime())) { weekWarnings.push('Dia da prova reservado; a competição não foi substituída por um treino genérico.'); continue; }
      let planned: string[] = explicit ? (Array.isArray(schedule[key]) ? schedule[key] : []) : [preferredDay(prefs,'natacao',key)&&swimming?'natacao':preferredDay(prefs,'forca',key)?'forca':modalities[index++ % modalities.length]];
      const brick=selected==='triatlo'&&preferredDay(prefs,'brick',key)&&(prefs.doubleDays===undefined||prefs.doubleDays.includes(key))&&phaseForDate(date,start,race)==='build'&&week>=(level==='iniciante'?4:2)&&!recovery&&!requiresCoachReview&&!returning;
      if(brick&&(prefs.doubleDays===undefined||prefs.doubleDays.includes(key)))planned=['ciclismo','corrida'];
      else if(preferredDay(prefs,'brick',key))weekWarnings.push('Brick adiado: exige construção, tolerância, recuperação e duas sessões permitidas.');
      for (const modality of [...new Set(planned)]) {
        if (modality !== 'forca' && !modalities.includes(modality as TrainingModality)) continue;
        if(modality==='forca' && profile?.strengthAvailable===false)continue;
        drafts.push({ date, modality: modality as TrainingModality, minutes: 0, phase: phaseForDate(date, start, race), high: 0, highZone: preferredDay(prefs,'ritmo',key)?'Z3':weekPhase === 'peak' || (shortGoal && weekPhase === 'build') ? 'Z5' : 'Z4', kind:brick?'brick':preferredDay(prefs,'longo',key)?'longo':modality==='natacao'?(week%2===0?'tecnica':'endurance'):modality==='ciclismo'?(week%3===0?'cadencia':'endurance'):preferredDay(prefs,'rodagem',key)?'rodagem':recovery?'recuperacao':'aerobico' });
      }
    }
    if (explicit && Object.keys(schedule).some(day => !days.includes(day) && schedule[day]?.length)) weekWarnings.push('Modalidades marcadas em dias indisponíveis foram ignoradas; ajuste a agenda na triagem.');
    // Preserva a sessão de força do fluxo legado, no mesmo dia disponível e dentro do orçamento.
    if (!explicit && days.length >= 3 && weekBudget >= 120 && !recovery && drafts.length && weekPhase !== 'transition' && weekPhase !== 'race') drafts.push({ date: drafts[0].date, modality: 'forca', minutes: 0, phase: drafts[0].phase, high: 0, highZone: 'Z4' });
    if(selected==='corrida'&&['15k','21k','42k'].includes(goal||'')&&!prefs.preferred?.longo?.length){
      const eligible=drafts.filter(d=>d.modality==='corrida'&&[0,6].includes(d.date.getUTCDay())&&(!profile?.dailyMinutes||Number((profile.dailyMinutes as Record<string,unknown>)[dayKey(d.date)])!==0));
      const long=eligible.find(d=>preferredDay(prefs,'longo',dayKey(d.date)))??eligible.find(d=>d.date.getUTCDay()===0)??eligible[0];
      if(long)long.kind='longo';else weekWarnings.push('Longão de fim de semana não encaixa na disponibilidade. Revise sábado/domingo; não foi movido silenciosamente para outro dia.');
    }
    const sessions = allocateMinutes(drafts.filter(item=>item.modality!=='forca' || profile?.strengthAvailable!==false), weekBudget, level, goal, profile?.dailyMinutes,profile?.planningPreferences,week,growth);
    if (sessions.length < drafts.length) weekWarnings.push('Tempo insuficiente para todas as sessões de pelo menos 10 minutos; não foi ultrapassada a disponibilidade. Revise a distribuição com o treinador.');
    if (!sessions.length) weekWarnings.push('Nenhuma sessão cabe no orçamento desta semana; ajuste disponibilidade e agenda com o treinador.');
    let targetHigh = 0.2;
    if (week < 2 || recovery || safety.review || days.length < 3 || currentHours === 0 || weekPhase === 'race' || weekPhase === 'transition' || (race && weekEnd > race && weekStart.getTime() <= race.getTime() + 28 * DAY_MS)) targetHigh = 0;
    else if (level === 'iniciante') targetHigh = week < 4 ? 0 : 0.1;
    else if (weekPhase === 'peak') targetHigh = 0.1;
    if ((numericValue(profile?.sleepHours) ?? 8) < 6 || profile?.stressLevel === 'alto') targetHigh = Math.min(targetHigh, 0.1);
    if(requiresCoachReview || returning)targetHigh=0;
    if(goal==='tecnica' || goal==='iniciacao')targetHigh=0;
    if(goal==='base')targetHigh=Math.min(targetHigh,.05);
    if(profile?.goalType==='completar')targetHigh=Math.min(targetHigh,.1);
    if(week===0)targetHigh=Math.min(targetHigh,feedback.highFraction);
    if (targetHigh < 0.2) weekWarnings.push('Menos de 20% intenso nesta semana por adaptação, recuperação, prova, disponibilidade ou necessidade de revisão; não compensar com intensidade extra.');
    const aerobic = sessions.filter(session => session.modality !== 'forca');
    const targetHighSeconds = Math.floor(aerobic.reduce((sum, session) => sum + session.minutes * 60, 0) * targetHigh / 30) * 30;
    const candidates = aerobic.filter(session => !['brick','longo','rodagem','recuperacao'].includes(session.kind||'') && !(session.modality==='natacao' && (profile?.swimLevel==='basico'||profile?.level==='iniciante')) && session.phase !== 'race' && session.phase !== 'transition' && highCapacitySeconds(session.minutes * 60, session.modality, session.highZone,session.kind) > 0 && (lastQualityDay == null || Math.round(session.date.getTime() / DAY_MS) - lastQualityDay >= 2)).sort((a,b)=>Number(preferredDay(prefs,'tiros',dayKey(b.date))||preferredDay(prefs,'ritmo',dayKey(b.date)))-Number(preferredDay(prefs,'tiros',dayKey(a.date))||preferredDay(prefs,'ritmo',dayKey(a.date))) || highCapacitySeconds(b.minutes*60,b.modality,b.highZone)-highCapacitySeconds(a.minutes*60,a.modality,a.highZone));
    if(selected==='corrida'&&prefs.recentMinutes?.corrida!=null)for(const candidate of candidates){candidate.kind=week%3===0?'ritmo':week%3===1?'tiros':'fartlek';candidate.highZone=candidate.kind==='ritmo'?'Z4':'Z5';}
    const quality: SessionDraft[] = [];
    const maximumQuality = days.length >= 4 ? 2 : 1;
    for (const candidate of candidates) {
      if (quality.length >= maximumQuality) break;
      if(sessions.some(other=>other.kind==='longo'&&Math.abs(other.date.getTime()-candidate.date.getTime())<2*DAY_MS))continue;
      if (quality.every(other => Math.abs(other.date.getTime() - candidate.date.getTime()) >= 2 * DAY_MS)) quality.push(candidate);
    }
    // Incrementos de 30 s permitem medir a distribuição real sem exceder o alvo.
    let remaining = targetHighSeconds;
    for (let pass = 0; remaining >= 30 && pass < 500; pass++) {
      let changed = false;
      for (const session of quality) {
        const capacity = highCapacitySeconds(session.minutes * 60, session.modality, session.highZone,session.kind);
        if (session.high + 30 > capacity || remaining < 30) continue;
        session.high += 30;
        const structures = sessions.map(item => buildWorkoutStructure(profile, item.modality, item.phase, item.minutes, item.high, item.highZone,'Z2',item.kind));
        const combined = combineDistributions(structures.map(structure => structure.distribution));
        if ((combined.highSeconds+combined.moderateSeconds)/Math.max(1,combined.enduranceSeconds) > targetHigh + 0.000001) { session.high -= 30; continue; }
        remaining -= 30;
        changed = true;
      }
      if (!changed) break;
    }
    if(prefs.preferred?.tiros?.length&&targetHigh>0&&!quality.some(item=>preferredDay(prefs,'tiros',dayKey(item.date))))weekWarnings.push('Preferência de tiros não pôde ser atendida com a recuperação e o tempo disponíveis. Revise um encaixe alternativo, sem acumular intensidade.');
    const built = sessions.map(draft => {
      const structure = buildWorkoutStructure(profile, draft.modality, draft.phase, draft.minutes, draft.high, draft.highZone,'Z2',draft.kind);
      markRunningThreshold(structure,profile);
      structure.requiresCoachReview = requiresCoachReview;
      structure.warnings = [...new Set([...structure.warnings, ...(safety.review ? safety.warnings : [])])];
      const kindLabel=draft.high>0&&draft.kind==='fartlek'?'Fartlek':draft.high>0&&draft.kind==='ritmo'?'Ritmo sustentado':draft.high>0?(draft.highZone==='Z3'?'Ritmo':draft.highZone==='Z5'?'Tiros curtos':'Intervalos longos'):draft.kind==='brick'?'Brick — '+(draft.modality==='ciclismo'?'1. Bike':'2. Corrida após bike'):draft.kind==='longo'?'Longo':draft.kind==='cadencia'?'Cadência':draft.kind==='tecnica'?'Técnica':draft.kind==='recuperacao'?'Recuperação':draft.modality==='corrida'?'Rodagem leve':'Endurance leve';
      const title = `${kindLabel} · ${LABEL[draft.modality]} · ${PHASE_LABEL[draft.phase]} · ${draft.high > 0 ? 'Intervalos estruturados' : recovery ? 'Recuperação' : 'Aeróbico e técnica'}`;
      const targetZone=structure.steps.filter(step=>step.kind==='principal'&&step.zone).sort((a,b)=>Number(b.zone!.slice(1))-Number(a.zone!.slice(1)))[0]?.zone||'Z1';
      const purpose=draft.kind==='longo'?'Desenvolver resistência de duração, respeitando o longão recente e a recuperação.':draft.kind==='fartlek'?'Alternar trechos rápidos e leves em corrida contínua, com recuperação em movimento; difere dos tiros pela alternância fluida dentro da sessão.':draft.kind==='ritmo'?'Sustentar intensidade de limiar em blocos controlados, sem transformar a sessão em teste máximo.':draft.high>0?'Acumular repetições controladas na intensidade indicada, separadas pelas recuperações prescritas.':draft.modality==='natacao'?'Consolidar técnica e resistência aquática com séries e pausas explícitas.':draft.modality==='ciclismo'?'Construir resistência específica de ciclismo e controlar a cadência e o esforço.':draft.modality==='forca'?'Complementar a preparação com força e mobilidade orientadas; não somar ao volume aeróbico.':'Construir volume confortável e favorecer a recuperação entre estímulos.';
      const workout: GeneratedWorkout = { date: draft.date.toISOString(), modality: draft.modality, title, description: withEnvironment('Objetivo desta sessão: '+purpose+'\n'+describeStructure(structure), profile, draft), duration: draft.minutes, targetZone, tssEstimate: null, phase: draft.phase, weekNumber: week + 1, structure };
      return workout;
    });
    const distribution = combineDistributions(built.map(workout => workout.structure.distribution));
    if (targetHigh > 0 && distribution.highFraction < targetHigh - 0.025) weekWarnings.push('O alvo de intensidade foi reduzido para manter intervalos viáveis e dias de recuperação; não foram criadas sessões extras para atingir uma porcentagem.');
    if (distribution.totalSeconds < weekBudget * 60 - 60 && sessions.length) weekWarnings.push('Parte do tempo disponível não foi alocada por limites operacionais de duração da sessão/dia; ajuste individual com o treinador.');
    const qualityDates = sessions.filter(session => session.high > 0).map(session => Math.round(session.date.getTime() / DAY_MS));
    if (qualityDates.length) lastQualityDay = Math.max(...qualityDates);
    workouts.push(...built);
    weekSummaries.push({ weekNumber: week + 1, phase: weekPhase, recovery, budgetMinutes: weekBudget, plannedMinutes: distribution.totalSeconds / 60, targetHighFraction: targetHigh, distribution, warnings: [...new Set(weekWarnings)] });
    warnings.push(...weekWarnings);
    previousPhase = weekPhase;
  }
  workouts.sort((a, b) => a.date.localeCompare(b.date) || a.modality.localeCompare(b.modality));
  warnings.push('Política do app: intensidade medida por tempo aeróbico ativo, incluindo aquecimento/desaquecimento e recuperação ativa. A referência 80/20 por sessões não é matematicamente idêntica.');
  warnings.push('Progressão operacional conservadora entre semanas de carga, com recuperação programada; não é garantia de prevenção de lesão. Revise sinais de dor, fadiga e tolerância com o treinador.');
  return result();
}
