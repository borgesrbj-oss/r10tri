'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkoutAdjustmentReview } from '@/lib/workout-adjustment';
import { Button } from './ui/button';

type Session = {
  id: string;
  date: Date | string;
  modality: string;
  duration: number;
  completed: boolean;
  paused: boolean;
  coachManaged?: boolean;
  brickGroupId?: string | null;
  structure?: unknown;
};
type Adjustment = {
  action: 'mover' | 'encurtar' | 'leve' | 'substituir' | 'pausar' | 'retomar';
  minutes?: number;
  modality?: string;
  date?: string;
};
interface Preview {
  previewId: string;
  date: string;
  duration: number;
  modality: string;
  targetZone: string | null;
  paused: boolean;
  description?: string;
  review: WorkoutAdjustmentReview;
}

const modalities = { corrida: 'Corrida', ciclismo: 'Ciclismo', natacao: 'Natação', forca: 'Força', descanso: 'Descanso' };
const numberLabel = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const dateLabel = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const formatDate = (date: string) => dateLabel.format(new Date(date + 'T12:00:00Z'));

export function WorkoutActions({ workout, onChanged }: { workout: Session; onChanged?: (date: string) => void }) {
  const router = useRouter();
  const [date, setDate] = useState(new Date(workout.date).toISOString().slice(0, 10));
  const [minutes, setMinutes] = useState(String(Math.max(4, Math.floor(workout.duration * 0.75))));
  const [modality, setModality] = useState(workout.modality);
  const [preview, setPreview] = useState<{ input: Adjustment; result: Preview } | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  if (workout.completed) return null;
  if (workout.coachManaged) return <p className="mt-2 text-sm text-muted-foreground">Solicite ao coach uma revisão desta sessão publicada.</p>;
  if (workout.brickGroupId) return <p className="mt-2 text-sm text-muted-foreground">Bike, transição e corrida fazem parte do mesmo treino. Ajuste o treino combinado durante o replanejamento.</p>;

  async function request(input: Adjustment, expectedPreview?: string) {
    setBusy(true);
    setMessage(null);
    if (!expectedPreview) setPreview(null);
    try {
      const response = await fetch('/api/workouts/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, id: workout.id, ...(expectedPreview ? { expectedPreview } : { preview: true }) }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage({ text: result.error || 'Confira os campos do ajuste.', error: true });
        if (response.status === 409) setPreview(null);
        return;
      }
      if (!expectedPreview) {
        setPreview({ input, result });
        return;
      }
      setPreview(null);
      setMessage({ text: result.message || 'Treino atualizado.', error: false });
      onChanged?.(result.date);
      router.refresh();
    } catch {
      setMessage({ text: 'Falha de conexão. Confira a agenda antes de tentar novamente.', error: true });
    } finally {
      setBusy(false);
    }
  }

  const variation = preview?.result;
  const fields = 'block w-full rounded-md border bg-background px-2 py-1.5';
  return (
    <details className="mt-2 rounded-lg border p-3 text-sm">
      <summary className="cursor-pointer font-medium">Mover ou adaptar esta sessão</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block">Nova data<input className={fields} type="date" value={date} disabled={busy} onChange={(event) => { setDate(event.target.value); setPreview(null); }} /></label>
          <Button type="button" size="sm" variant="outline" disabled={busy || !date} onClick={() => request({ action: 'mover', date })}>Ver mudança de dia</Button>
        </div>
        {Boolean(workout.structure) && (
          <div className="space-y-2">
            <label className="block">Duração da alternativa em minutos
              <input className={fields} type="number" min="4" max={workout.duration - 1} step="1" value={minutes} disabled={busy || workout.duration <= 4}
                onChange={(event) => { setMinutes(event.target.value); setPreview(null); }} />
            </label>
            <Button type="button" size="sm" variant="outline" disabled={busy || !Number.isInteger(Number(minutes)) || Number(minutes) < 4 || Number(minutes) >= workout.duration} onClick={() => request({ action: 'encurtar', minutes: Number(minutes) })}>Ver versão mais curta</Button>
          </div>
        )}
        {Boolean(workout.structure) && workout.modality !== 'forca' && (
          <Button type="button" size="sm" variant="outline" className="justify-self-start" disabled={busy} onClick={() => request({ action: 'leve' })}>Ver versão mais leve</Button>
        )}
        <Button type="button" size="sm" variant="outline" className="justify-self-start" disabled={busy} onClick={() => request({ action: workout.paused ? 'retomar' : 'pausar' })}>{workout.paused ? 'Rever retomada' : 'Rever pausa'}</Button>
      </div>
      {Boolean(workout.structure) && (
        <details className="mt-4 space-y-2">
          <summary className="cursor-pointer">Trocar modalidade</summary>
          <label className="block">Modalidade proposta<select className={fields} value={modality} disabled={busy}
            onChange={(event) => { setModality(event.target.value); setPreview(null); }}>
            {Object.entries(modalities).filter(([id]) => id !== 'descanso').map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <Button type="button" size="sm" variant="outline" disabled={busy || modality === workout.modality} onClick={() => request({ action: 'substituir', modality })}>Ver substituição</Button>
        </details>
      )}
      {variation && (
        <section aria-label="Prévia da sessão" className="mt-4 space-y-3 rounded-lg border bg-muted/35 p-3">
          <h3 className="font-semibold">Prévia da sessão</h3>
          <p>{formatDate(variation.date)} · {(modalities as Record<string, string>)[variation.modality] ?? variation.modality} · {variation.duration} min{variation.targetZone ? ' · ' + variation.targetZone : ''}{variation.paused ? ' · pausada' : ''}</p>
          {variation.review.weeks.map(({ start, before, after }) => (
            <div key={start} className="space-y-1">
              <p className="font-medium">Semana de {formatDate(start)} · {before.minutes} → {after.minutes} min</p>
              <p className="text-muted-foreground">Z1–Z2 {numberLabel.format(before.lowMinutes)} → {numberLabel.format(after.lowMinutes)} min · Z3 {numberLabel.format(before.moderateMinutes)} → {numberLabel.format(after.moderateMinutes)} min · Z4–Z5 {numberLabel.format(before.highMinutes)} → {numberLabel.format(after.highMinutes)} min</p>
              {(before.unclassifiedMinutes > 0 || after.unclassifiedMinutes > 0) && <p className="text-muted-foreground">Sem dados de zona · {numberLabel.format(before.unclassifiedMinutes)} → {numberLabel.format(after.unclassifiedMinutes)} min</p>}
            </div>
          ))}
          {variation.review.conflicts.length > 0 && <ul className="list-disc space-y-1 pl-4 text-destructive">{variation.review.conflicts.map((item) => <li key={item}>{item}</li>)}</ul>}
          {variation.review.warnings.length > 0 && <ul className="list-disc space-y-1 pl-4 text-muted-foreground">{variation.review.warnings.map((item) => <li key={item}>{item}</li>)}</ul>}
          {variation.description && <details><summary className="cursor-pointer">Ver blocos propostos</summary><p className="mt-2 whitespace-pre-wrap">{variation.description}</p></details>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={busy || variation.review.conflicts.length > 0}
              onClick={() => preview && request(preview.input, preview.result.previewId)}>Confirmar alteração</Button>
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setPreview(null)}>Cancelar prévia</Button>
          </div>
        </section>
      )}
      {message && <p role={message.error ? 'alert' : 'status'} className={message.error ? 'mt-2 text-destructive' : 'mt-2 text-primary'}>{message.text}</p>}
    </details>
  );
}
