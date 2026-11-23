/** Contrato versionado de prescrição. Durações em segundos são a fonte de verdade. */
export type TrainingZone = 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';
export type TrainingModality = 'corrida' | 'ciclismo' | 'natacao' | 'forca';
export type TrainingPhase = 'base' | 'build' | 'peak' | 'race' | 'transition';
export type TrainingStepKind = 'aquecimento' | 'principal' | 'recuperacao' | 'desaquecimento';

export interface TrainingTarget {
  basis: 'ftp' | 'run_threshold' | 'threshold_hr' | 'css' | 'rpe';
  unit: 'W' | 's/km' | 'bpm' | 's/100m' | 'RPE';
  low: number;
  high: number;
  text: string;
  source: string;
}

export interface TrainingStep {
  kind: TrainingStepKind;
  label: string;
  durationSeconds: number;
  zone: TrainingZone | null;
  rest: 'ativo' | 'passivo' | null;
  target: TrainingTarget;
  /** Estimativa auxiliar; a duração continua sendo o limite da sessão. */
  distanceMeters?: number;
}

export interface TrainingDistribution {
  lowSeconds: number;
  moderateSeconds: number;
  highSeconds: number;
  restSeconds: number;
  enduranceSeconds: number;
  strengthSeconds: number;
  totalSeconds: number;
  highFraction: number;
}

export interface WorkoutStructure {
  origin?: 'coach';
  /** Km são a prescrição; segundos continuam como estimativa para planejar carga. */
  prescriptionMode?: 'distancia';
  thresholdReference?: {basis:'run_threshold'|'threshold_hr'|'ftp'|'css';value:number};
  version: 1;
  modality: TrainingModality;
  phase: TrainingPhase;
  durationSeconds: number;
  steps: TrainingStep[];
  distribution: TrainingDistribution;
  warnings: string[];
  requiresCoachReview: boolean;
}

export interface GeneratedWorkout {
  date: string;
  modality: TrainingModality;
  title: string;
  description: string;
  duration: number;
  targetZone: TrainingZone;
  tssEstimate: number | null;
  phase: TrainingPhase;
  weekNumber: number;
  structure: WorkoutStructure;
}

export interface TrainingProfile {
  planningPreferences?:unknown;
  heightCm?: number | null;
  goalTime?: string | null;
  goalType?: string | null;
  dailyMinutes?: unknown;
  inactivityWeeks?: number | null;
  strengthAvailable?: boolean | null;
  swimLevel?: string | null;
  runLevel?: string | null;
  bikeLevel?: string | null;
  /** Objetivo escolhido para este plano; não substitui a intenção esportiva do perfil. */
  trainingGoal?: string | null;
  runStructure?: string | null;
  level?: string | null;
  modality?: string | null;
  weeklyHours?: number | string | null;
  currentWeeklyVol?: number | string | null;
  availableDays?: string[] | null;
  daySchedule?: string | Record<string, string[]> | null;
  birthDate?: Date | string | null;
  currentWeight?: number | string | null;
  injuryHistory?: string | null;
  currentInjuries?: string | null;
  limitations?: string | null;
  medicalConditions?: string | null;
  sleepHours?: number | string | null;
  stressLevel?: string | null;
  canSwim?: boolean | null;
  hasPoolAccess?: boolean | null;
  poolSize?: string | null;
  hasPowerMeter?: boolean | null;
  hasTrainer?: boolean | null;
  hasHRM?: boolean | null;
  ftp?: number | string | null;
  testFTPEstimated?: number | string | null;
  runThresholdPace?: string | null;
  testRunPace?: string | null;
  runPace?: string | null;
  testRun3km?: string | null;
  swimCssPace?: string | null;
  testCSSPace?: string | null;
  swimPace?: string | null;
  testCSS400?: string | null;
  testCSS200?: string | null;
  maxHeartRate?: number | string | null;
  restingHeartRate?: number | string | null;
  thresholdHeartRate?: number | string | null;
  recentRaceDistanceKm?: number | string | null;
  recentRaceTimeSeconds?: number | string | null;
  recentRaceDate?: Date | string | null;
  runEnvByDay?: string | null;
  bikeEnvByDay?: string | null;
  dietaryNotes?: string | null;
}

export interface TrainingRace {
  priority?: string | null;
  date: Date | string;
  name?: string | null;
  distance?: string | null;
}

export interface TrainingWeekSummary {
  weekNumber: number;
  phase: TrainingPhase;
  recovery: boolean;
  budgetMinutes: number;
  plannedMinutes: number;
  targetHighFraction: number;
  distribution: TrainingDistribution;
  warnings: string[];
}

export interface StructuredPlan {
  workouts: GeneratedWorkout[];
  warnings: string[];
  summary: {
    calculation?: {version:1;method:string;initialMinutes:number;weeklyCapMinutes:number|null;growth:number;inputs:Record<string,unknown>;rules:string[];sourceIds:string[]};
    feedback?: { status: string; reasons: string[]; observedSessions: number };
    basis: 'tempo_aerobico_ativo';
    targetHighFraction: 0.2;
    goal: string | null;
    warnings: string[];
    requiresCoachReview: boolean;
    distribution: TrainingDistribution;
    weeks: TrainingWeekSummary[];
  };
}
