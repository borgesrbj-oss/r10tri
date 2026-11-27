import { cssFromTests, formatPaceSeconds, ftpFromTwentyMinutes, runThreshold } from './training-zones';
import { assessmentIssue } from './assessment-review';
import { z } from 'zod';
import { TRAINING_GOALS } from './training-goals';

const text = (max = 2000) => z.string().trim().max(max).nullable().optional();
const number = (min: number, max: number, integer = false) => z.preprocess(value => {
  if (value === '' || value === null) return null;
  if (typeof value === 'string') return Number(value);
  return value;
}, (integer ? z.number().int() : z.number()).min(min).max(max).nullable().optional());
const option = (choices: [string, ...string[]]) => z.preprocess(value => value === '' ? undefined : value, z.enum(choices).optional());
const pace = z.preprocess(value => value === '' ? null : value, z.string().regex(/^\d{1,2}:[0-5]\d$/, 'Use o formato mm:ss.').refine(value => value !== '00:00' && value !== '0:00', 'Informe um tempo maior que zero.').nullable().optional());
const date = z.preprocess(value => value === '' ? null : value, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use uma data válida.').refine(value => {
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
}, 'Data de calendário inválida.').nullable().optional());

export const assessmentSchema = z.object({
  planningPreferences:z.preprocess(value=>value==null?undefined:value,z.object({recentLongRunMinutes:z.number().int().min(1).max(480).optional(),recentLongRunKm:z.number().min(.1).max(100).optional(),preferred:z.partialRecord(z.enum(['tiros','rodagem','longo','ritmo','brick','natacao','forca','descanso']),z.array(z.enum(['seg','ter','qua','qui','sex','sab','dom'])).max(7)).optional(),doubleDays:z.array(z.enum(['seg','ter','qua','qui','sex','sab','dom'])).max(7).optional(),maxSessionMinutes:z.number().int().min(10).max(480).optional(),recentMinutes:z.partialRecord(z.enum(['corrida','ciclismo','natacao']),z.number().int().min(0).max(1800)).optional()}).optional()),
  runStructure: z.preprocess(value=>value==null?undefined:value,option(['zona','distancia'])),
  birthDate: date,
  heightCm: number(80, 250),
  inactivityWeeks: number(0, 104, true),
  strengthAvailable: z.boolean().nullable().optional(),
  dailyMinutes: z.preprocess(value => value == null ? undefined : value, z.record(z.enum(['seg','ter','qua','qui','sex','sab','dom']), number(0,480,true)).optional()),
  currentWeight: number(1, 500), targetWeight: number(1, 500),
  level: option(['iniciante', 'intermediario', 'avancado']),
  modality: option(['triatlo', 'natacao', 'ciclismo', 'corrida']),
  trainingYears: number(0, 100, true), previousPlanExp: text(80), raceHistory: text(),
  swimLevel: text(80), bikeLevel: text(80), runLevel: text(80), weakestSport: text(80), strongestSport: text(80),
  maxHeartRate: number(30, 260, true), restingHeartRate: number(20, 220, true), thresholdHeartRate: number(30, 250, true),
  ftp: number(1, 1500), vo2max: number(1, 120), swimPace: pace, runPace: pace,
  runThresholdPace: pace, swimCssPace: pace,
  recentRaceDistanceKm: number(0.1, 500), recentRaceTimeSeconds: number(1, 259200, true), recentRaceDate: date,
  goalType: text(80), goalTime: text(80),
  trainingGoal:text(40),
  testCSS400: pace, testCSS200: pace, testCSSPace: pace,
  testFTP20min: number(1, 1500), testFTPEstimated: number(1, 1500), testFTPHR: number(30, 260, true),
  testRun30min: number(0.1, 20), testRunPace: pace, testRunHR: number(30, 260, true), testRun3km: pace,
  canSwim: z.boolean().optional(), testsCompleted: z.boolean().optional(),
  injuryHistory: text(), currentInjuries: text(), medicalConditions: text(), sleepHours: number(0, 24), stressLevel: text(80), dietaryNotes: text(),
  carbohydrateRateGPerHour: number(1, 120),
  weeklyHours: number(0, 40), currentWeeklyVol: number(0, 40),
  availableDays: z.array(z.enum(['seg','ter','qua','qui','sex','sab','dom'])).max(7).transform(days => [...new Set(days)]).optional(),
  workSchedule: text(100), travelFrequency: text(100), hasPoolAccess: z.boolean().optional(), poolSize: text(80),
  hasTrainer: z.boolean().optional(), hasPowerMeter: z.boolean().optional(), hasHRM: z.boolean().optional(), bikeType: text(80), limitations: text(),
}).superRefine((data, context) => {
  if(data.trainingGoal && (data.modality ? !Object.prototype.hasOwnProperty.call(TRAINING_GOALS[data.modality]??{},data.trainingGoal) : !Object.values(TRAINING_GOALS).some(goals=>Object.prototype.hasOwnProperty.call(goals,data.trainingGoal!))))context.addIssue({code:'custom',path:['trainingGoal'],message:'Escolha um foco compatível com a modalidade.'});
  if (data.maxHeartRate && data.restingHeartRate && data.restingHeartRate >= data.maxHeartRate) context.addIssue({ code:'custom', path:['restingHeartRate'], message:'A FC de repouso deve ser menor que a FC máxima informada.' });
  if (data.thresholdHeartRate && data.maxHeartRate && data.thresholdHeartRate > data.maxHeartRate) context.addIssue({ code:'custom', path:['thresholdHeartRate'], message:'A FC de limiar não pode superar a FC máxima informada.' });
  for (const key of ['birthDate','recentRaceDate'] as const) {
    if (data[key] && data[key]! > new Date().toISOString().slice(0,10)) context.addIssue({code:'custom',path:[key],message:'Informe uma data que não esteja no futuro.'});
  }
});

export function assessmentReadiness(profile: Record<string, unknown> | null | undefined) {
  const missing: string[] = [];
  const fields: string[] = [];
  const requireField=(field:string,label:string)=>{fields.push(field);missing.push(label);};
  if (!profile?.birthDate) requireField('birthDate','data de nascimento');
  if (!(Number(profile?.currentWeight) > 0)) requireField('currentWeight','peso atual');
  if (!['iniciante','intermediario','avancado'].includes(String(profile?.level))) requireField('level','experiência');
  const hasWeeklyLimit=profile?.weeklyHours!=null&&profile.weeklyHours!=='';
  if (hasWeeklyLimit&&!(Number(profile?.weeklyHours)>0))requireField('weeklyHours','limite semanal inválido; deixe vazio se não houver');
  if (!Array.isArray(profile?.availableDays) || profile.availableDays.length === 0) requireField('availableDays','dias disponíveis');
  if (!['triatlo','natacao','ciclismo','corrida'].includes(String(profile?.modality))) requireField('modality','modalidade');
  const distanceRequired=['corrida','triatlo'].includes(String(profile?.modality))&&profile?.runStructure==='distancia';
  if(distanceRequired&&!runThreshold(profile))requireField('runThresholdPace','pace de limiar para prescrever por km');
  return { complete: missing.length === 0, missing, issues: fields.map(field=>assessmentIssue(field,'Preencha ou corrija este campo.')!), completedPercent: Math.round(((5+Number(hasWeeklyLimit)+Number(distanceRequired))-missing.length)/(5+Number(hasWeeklyLimit)+Number(distanceRequired))*100) };
}

export function assessmentData(body: unknown, previous?: Record<string, unknown> | null) {
  const result = assessmentSchema.safeParse(body);
  if (!result.success) return { ok:false as const, errors:result.error.issues.map(issue => ({ field:issue.path.join('.'), message:/^(Invalid|Too |Expected|Unrecognized)/.test(issue.message) ? 'Valor inválido. Confira o campo informado.' : issue.message })) };
  const patch = Object.fromEntries(Object.entries(result.data).filter(([, value]) => value !== undefined)) as z.infer<typeof assessmentSchema>;
  const cssTimesChanged = patch.testCSS400 !== undefined || patch.testCSS200 !== undefined;
  if (cssTimesChanged) {
    const time400 = patch.testCSS400 !== undefined ? patch.testCSS400 : previous?.testCSS400;
    const time200 = patch.testCSS200 !== undefined ? patch.testCSS200 : previous?.testCSS200;
    const css = cssFromTests(time400, time200);
    if ((time400 || time200) && css === null) {
      return { ok:false as const, errors:[{ field: time400 ? 'testCSS200' : 'testCSS400', message:'Registre os dois tempos. O tempo de 400 m deve ser pelo menos duas vezes o de 200 m e gerar um CSS entre 0:25 e 10:00 por 100 m.' }] };
    }
    patch.testCSSPace = css === null ? null : formatPaceSeconds(css);
  }
  if (patch.testFTP20min !== undefined) patch.testFTPEstimated = ftpFromTwentyMinutes(patch.testFTP20min);
  if (previous) {
    const stored = { ...previous };
    // O banco devolve Date; o formulário envia dias de calendário. Só a entrada
    // armazenada é normalizada: o corpo recebido continua exigindo uma data válida.
    for (const key of ['birthDate', 'recentRaceDate'] as const) {
      if (stored[key] instanceof Date && Number.isFinite(stored[key].getTime())) stored[key] = stored[key].toISOString().slice(0, 10);
    }
    const merged = assessmentSchema.safeParse({ ...stored, ...patch });
    if (!merged.success) return { ok:false as const, errors:merged.error.issues.map(issue => ({ field:issue.path.join('.'), message:/^(Invalid|Too |Expected|Unrecognized)/.test(issue.message) ? 'Valor inválido. Confira o campo informado.' : issue.message })) };
  }
  // Devolve apenas o patch validado, sem regravar campos ou metadados do perfil.
  const {birthDate,recentRaceDate,...values}=patch;
  const data = {
    ...values,
    ...(birthDate !== undefined ? {birthDate:birthDate ? new Date(`${birthDate}T12:00:00Z`) : null} : {}),
    ...(recentRaceDate !== undefined ? {recentRaceDate:recentRaceDate ? new Date(`${recentRaceDate}T12:00:00Z`) : null} : {}),
  };
  return {ok:true as const, data};
}
