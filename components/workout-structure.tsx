'use client';

import type { WorkoutStructure as StructuredWorkout } from '@/lib/training-types';
import { buildWaLink } from '@/lib/wa';
import { Button } from '@/components/ui/button';
import { effortTarget } from '@/lib/training-zones';

const KINDS: Record<string, string> = { aquecimento: 'Aquecimento', principal: 'Bloco principal', recuperacao: 'Recuperação', desaquecimento: 'Desaquecimento' };
const MODALITIES = ['corrida', 'ciclismo', 'natacao', 'forca'];
const ZONES = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'];

export function getWorkoutStructure(value: unknown): StructuredWorkout | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Partial<StructuredWorkout>;
  if (data.version !== 1 || !MODALITIES.includes(String(data.modality)) || !Array.isArray(data.steps) || data.steps.length === 0 || !Number.isInteger(data.durationSeconds) || Number(data.durationSeconds) <= 0) return null;
  for (const step of data.steps) {
    if (!step || !KINDS[step.kind] || !Number.isInteger(step.durationSeconds) || step.durationSeconds <= 0 || (step.zone !== null && !ZONES.includes(step.zone)) || ![null, 'ativo', 'passivo'].includes(step.rest) || !step.target || typeof step.target.text !== 'string') return null;
  }
  if (data.steps.reduce((sum, step) => sum + step.durationSeconds, 0) !== data.durationSeconds) return null;
  return data as StructuredWorkout;
}

export function formatTrainingDuration(seconds: number): string {
  const value = Math.max(0, Math.round(seconds));
  const h = Math.floor(value / 3600);
  const m = Math.floor((value % 3600) / 60);
  const s = value % 60;
  return [h ? `${h}h` : '', m ? `${m}min` : '', s ? `${s}s` : ''].filter(Boolean).join(' ') || '0min';
}

export function trainingDistribution(workouts: { structure?: unknown }[]) {
  const totals = { low: 0, moderate: 0, high: 0, rest: 0, strength: 0, unclassified: 0, legacy: 0 };
  for (const workout of workouts) {
    const structure = getWorkoutStructure(workout.structure);
    if (!structure) { totals.legacy++; continue; }
    for (const step of structure.steps) {
      if (step.rest === 'passivo') totals.rest += step.durationSeconds;
      else if (structure.modality === 'forca') totals.strength += step.durationSeconds;
      else if (step.zone === 'Z1' || step.zone === 'Z2') totals.low += step.durationSeconds;
      else if (step.zone === 'Z3') totals.moderate += step.durationSeconds;
      else if (step.zone === 'Z4' || step.zone === 'Z5') totals.high += step.durationSeconds;
      else totals.unclassified += step.durationSeconds;
    }
  }
  return { ...totals, endurance: totals.low + totals.moderate + totals.high };
}

export function TrainingDistributionSummary({ workouts, title = 'Distribuição por tempo', compact = false }: { workouts: { structure?: unknown }[]; title?: string; compact?: boolean }) {
  const total = trainingDistribution(workouts);
  const percent = (seconds: number) => total.endurance > 0 ? `${Math.round((seconds / total.endurance) * 100)}%` : '—';
  return (
    <section className={`rounded-lg border bg-muted/20 ${compact ? 'p-3' : 'p-4'} space-y-2`} aria-label={title}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
        <div><dt className="text-muted-foreground">Z1–Z2 · leve</dt><dd className="font-medium">{formatTrainingDuration(total.low)} · {percent(total.low)}</dd></div>
        <div><dt className="text-muted-foreground">Z3 · moderado</dt><dd className="font-medium">{formatTrainingDuration(total.moderate)} · {percent(total.moderate)}</dd></div>
        <div><dt className="text-muted-foreground">Z4–Z5 · intenso</dt><dd className="font-medium">{formatTrainingDuration(total.high)} · {percent(total.high)}</dd></div>
      </dl>
      <p className="text-xs text-muted-foreground">Planejado: referência de bloco ~80% baixo / ~20% moderado + alto, somando Z3–Z5. Percentuais do tempo aeróbico ativo, incluindo aquecimento, recuperação ativa e desaquecimento. Força: {formatTrainingDuration(total.strength)}; pausas passivas: {formatTrainingDuration(total.rest)}, contabilizadas à parte. A intensidade pode ficar abaixo de 20% em adaptação, recuperação e transição.</p>
      {total.legacy > 0 && <p className="text-xs text-amber-500">{total.legacy} treino(s) sem estrutura válida não entram no cálculo de intensidade; os percentuais são parciais. O texto legado foi preservado.</p>}
      {total.unclassified > 0 && <p className="text-xs text-amber-500">Há {formatTrainingDuration(total.unclassified)} sem zona classificada; revise a prescrição antes de interpretar os percentuais.</p>}
      {total.endurance === 0 && <p className="text-xs text-muted-foreground">Ainda não há tempo aeróbico estruturado para calcular a distribuição 80/20.</p>}
    </section>
  );
}

export function WorkoutStructure({ value, description }: { value: unknown; description?: string | null }) {
  const structure = getWorkoutStructure(value);
  if (!structure) return <div className="space-y-2"><p className="text-sm whitespace-pre-wrap">{description || 'Sem descrição cadastrada.'}</p><p className="text-xs text-muted-foreground">Treino legado ou sem blocos válidos. Sua descrição original foi preservada; as etapas não foram inventadas a partir do texto.</p></div>;
  return <div className="space-y-3">
    <p className="text-sm font-medium">Estrutura completa · {formatTrainingDuration(structure.durationSeconds)}</p>
    <ol className="space-y-2">
      {structure.steps.map((step, index) => <li key={index} className="rounded-lg border bg-background/50 p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong>{index + 1}. {KINDS[step.kind]}</strong><span className="tabular-nums">{formatTrainingDuration(step.durationSeconds)} · {step.rest === 'passivo' ? 'Pausa passiva' : step.zone || 'Força/técnica'}</span></div>
        {step.label && <p className="mt-1">{step.label}</p>}
        <p className="mt-1 text-xs text-muted-foreground">{step.rest==='passivo'?'Pausa sem esforço':`PSE: ${effortTarget(step.zone||'Z2').low}–${effortTarget(step.zone||'Z2').high}/10 · escala operacional de esforço`}</p>
        <p className="mt-1 break-words text-muted-foreground">{step.target.text}{step.rest === 'ativo' ? ' · recuperação ativa' : ''}{Number.isFinite(step.distanceMeters) && Number(step.distanceMeters) > 0 ? ` · distância auxiliar ~${Math.round(Number(step.distanceMeters))} m` : ''}</p>
      </li>)}
    </ol>
    {Array.isArray(structure.warnings) && structure.warnings.length > 0 && <ul className="list-disc space-y-1 pl-4 text-xs text-amber-500">{structure.warnings.filter(warning => typeof warning === 'string').map((warning, index) => <li key={index}>{warning}</li>)}</ul>}
    {description && <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">Descrição completa do treino</summary><p className="mt-2 whitespace-pre-wrap">{description}</p></details>}
  </div>;
}

export function workoutWhatsappMessage(workout: { title?: string; date?: string | Date; structure?: unknown; duration?: number; modality?: string }) {
  const structure = getWorkoutStructure(workout.structure);
  const date = workout.date ? new Date(workout.date) : null;
  const dateLabel = date && Number.isFinite(date.getTime()) ? date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Data a confirmar';
  const lines = ['R10 TRI — treino', workout.title || 'Treino', dateLabel];
  if (structure) {
    lines.push(`Duração: ${formatTrainingDuration(structure.durationSeconds)}`);
    structure.steps.forEach((step, index) => lines.push(`${index + 1}. ${KINDS[step.kind]} · ${formatTrainingDuration(step.durationSeconds)} · ${step.rest === 'passivo' ? 'pausa' : step.zone || 'força/técnica'} · ${step.target.text}`));
  } else lines.push('Treino legado: abra o app para consultar a descrição e os detalhes.');
  return lines.join('\n');
}

export function WorkoutWhatsappLink({ workout, whatsapp }: { workout: Parameters<typeof workoutWhatsappMessage>[0]; whatsapp?: string | null }) {
  const link = buildWaLink(whatsapp, workoutWhatsappMessage(workout));
  if (!link) return <p className="text-xs text-muted-foreground">Cadastre seu WhatsApp no perfil para abrir o compartilhamento do treino.</p>;
  return <div className="space-y-1"><Button asChild variant="outline" size="sm"><a href={link} target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()}>Compartilhar treino no WhatsApp</a></Button><p className="text-xs text-muted-foreground">Abre o texto para revisão. O envio só acontece quando você confirmar no WhatsApp.</p></div>;
}
