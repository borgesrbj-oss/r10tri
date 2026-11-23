'use client';
import {workoutPrescription} from '@/lib/training-prescription';
import {WeekReview} from '@/components/week-review';
import {WorkoutActions} from '@/components/workout-actions';

import { useState } from 'react';
import { Calendar, Waves, Bike, Timer, Dumbbell, CheckCircle2, ClipboardEdit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FadeIn } from '@/components/ui/animate';
import { SafeDate } from '@/components/safe-format';
import { WorkoutStructure } from '@/components/workout-structure';
import { inCalendarPeriod, weekStart, type CalendarView } from '@/lib/calendar-period';

const icons: Record<string, any> = { natacao: Waves, ciclismo: Bike, corrida: Timer, forca: Dumbbell };
const colors: Record<string, string> = { natacao: 'bg-blue-50 dark:bg-blue-950', ciclismo: 'bg-orange-50 dark:bg-orange-950', corrida: 'bg-green-50 dark:bg-green-950', forca: 'bg-purple-50 dark:bg-purple-950' };

export function CalendarioClient({ workouts }: { workouts: any[] }) {
  const [filter, setFilter] = useState('todos');
  const [view,setView]=useState<CalendarView>('semana');
  const [anchor,setAnchor]=useState(()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));
  const [logDialog, setLogDialog] = useState<any>(null);
  const [logForm, setLogForm] = useState({ actualDuration: '', actualDistance: '', rpe: '', weight: '', notes: '', sleepHours: '', fatigueScore: '', painScore: '' });
  const [logError, setLogError] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const filtered = (workouts ?? []).filter(w=>(filter==='todos'||w.modality===filter)&&inCalendarPeriod(String(w.date),anchor,view));

  // Group by week
  const byWeek = new Map<string, any[]>();
  for (const w of filtered ?? []) {
    const key = weekStart(String(w.date));
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(w);
  }

  const handleLog = async () => {
    if (!logDialog?.id) return;
    setLogError('');
    for (const [field, min, max, label] of [['sleepHours', 0, 24, 'Sono'], ['fatigueScore', 0, 10, 'Fadiga'], ['painScore', 0, 10, 'Dor'], ['rpe', 1, 10, 'RPE']] as const) {
      if (logForm[field] !== '' && (!Number.isFinite(Number(logForm[field])) || Number(logForm[field]) < min || Number(logForm[field]) > max || (field !== 'sleepHours' && !Number.isInteger(Number(logForm[field]))))) {
        setLogError(`${label}: informe um valor entre ${min} e ${max}${field === 'sleepHours' ? ' horas' : ', em números inteiros'}.`); return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch('/api/workouts/log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId: logDialog.id,
          actualDuration: logForm.actualDuration ? Number(logForm.actualDuration) : null,
          actualDistance: logForm.actualDistance ? Number(logForm.actualDistance) : null,
          rpe: logForm.rpe ? Number(logForm.rpe) : null,
          weight: logForm.weight ? Number(logForm.weight) : null,
          notes: logForm.notes || null,
          sleepHours: logForm.sleepHours !== '' ? Number(logForm.sleepHours) : null,
          fatigueScore: logForm.fatigueScore !== '' ? Number(logForm.fatigueScore) : null,
          painScore: logForm.painScore !== '' ? Number(logForm.painScore) : null,
        }),
      });
      if (res.ok) { toast.success('Treino registrado!'); setLogDialog(null); router.refresh(); }
      else {
        const data = await res.json().catch(() => null);
        const details = Array.isArray(data?.details) ? data.details.map((detail: unknown) => typeof detail === 'string' ? detail : detail && typeof detail === 'object' && 'message' in detail && typeof detail.message === 'string' ? detail.message : '').filter(Boolean) : [];
        const message = [data?.error || 'Não foi possível registrar o treino.', ...details].join(' ');
        setLogError(message); toast.error(data?.error || 'Erro ao registrar');
      }
    } catch { setLogError('Sem conexão com o servidor. Reconecte antes de salvar o registro.'); toast.error('Erro ao registrar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-tight font-bold flex items-center gap-2"><Calendar className="h-7 w-7 text-primary" /> Calendário de Treinos</h1>
          <p className="text-muted-foreground">Sua agenda por dia, semana ou mês. Abra o treino para rever a prescrição e registrar como se sentiu.</p>
        </div>
      </FadeIn>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Período da agenda">
          {([['dia','Dia'],['semana','Semana'],['mes','Mês'],['todos','Todos os períodos']] as const).map(([key,label])=><Button key={key} variant={view===key?'default':'outline'} size="sm" aria-pressed={view===key} onClick={()=>setView(key)}>{label}</Button>)}
        </div>
        <div className="space-y-1"><Label htmlFor="calendar-anchor">Data de referência</Label><Input id="calendar-anchor" type="date" value={anchor} onChange={event=>{if(event.target.value)setAnchor(event.target.value);}} className="w-auto" /></div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[{ key: 'todos', label: 'Todos' }, { key: 'natacao', label: 'Natação' }, { key: 'ciclismo', label: 'Ciclismo' }, { key: 'corrida', label: 'Corrida' }, { key: 'forca', label: 'Força' }].map((f: any) => (
          <Button key={f.key} variant={filter === f.key ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f.key)}>{f.label}</Button>
        ))}
      </div>

      <WeekReview date={anchor} revision={workouts} />
      {(filtered?.length ?? 0) === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground"><Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Nenhum treino encontrado</p></CardContent></Card>
      ) : (
        <div className="space-y-6">
          {Array.from(byWeek.entries()).map(([weekKey, wkWorkouts]) => (
            <Card key={weekKey}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Semana de <SafeDate date={weekKey} options={{ day: 'numeric', month: 'long' }} locale="pt-BR" /></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {wkWorkouts?.map((w: any) => {
                    const Icon = icons?.[w?.modality] ?? Dumbbell;
                    return (
                      <div key={w?.id}><div className={`flex items-center gap-3 p-3 rounded-lg ${colors?.[w?.modality] ?? 'bg-muted/50'} ${w?.completed ? 'opacity-60' : ''}`}>
                        <Icon className="h-5 w-5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{w?.title}</p>
                          <p className="text-xs text-muted-foreground"><SafeDate date={w?.date} options={{ weekday: 'short', day: 'numeric', month: 'short' }} locale="pt-BR" /> · {workoutPrescription(w)} · {w?.targetZone ?? ''}</p>
                        </div>
                        {w?.paused ? <Badge variant="secondary">Pausado</Badge> : w?.completed ? (
                          <Badge variant="secondary" className="shrink-0"><CheckCircle2 className="h-3 w-3 mr-1" /> Feito</Badge>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => { setLogDialog(w); setLogError(''); setLogForm({ actualDuration: String(w?.duration ?? ''), actualDistance: '', rpe: '', weight: '', notes: '', sleepHours: '', fatigueScore: '', painScore: '' }); }}>
                            <ClipboardEdit className="h-4 w-4 mr-1" /> Registrar
                          </Button>
                        )}
                      </div><WorkoutActions workout={w} onChanged={date=>{setAnchor(date);setView("semana");}} /></div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!logDialog} onOpenChange={(o: boolean) => !o && setLogDialog(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar Treino: {logDialog?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <details className="rounded-lg border p-3"><summary className="cursor-pointer text-sm font-medium">Rever a prescrição antes de registrar</summary><div className="mt-3"><WorkoutStructure value={logDialog?.structure} description={logDialog?.description} /></div></details>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Duração Real (min)</Label><Input type="number" value={logForm.actualDuration} onChange={(e: any) => setLogForm((p: any) => ({ ...p, actualDuration: e?.target?.value ?? '' }))} /></div>
              <div className="space-y-2"><Label>Distância (km)</Label><Input type="number" step="0.1" value={logForm.actualDistance} onChange={(e: any) => setLogForm((p: any) => ({ ...p, actualDistance: e?.target?.value ?? '' }))} /></div>
            </div>
            <fieldset className="space-y-3 rounded-lg border p-3">
              <legend className="px-1 text-sm font-semibold">Check-in de recuperação — opcional</legend>
              <p className="text-xs text-muted-foreground">Registre o que observou hoje, sem preencher o que não souber. As informações ajudam o coach a revisar a carga; não são um diagnóstico.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2"><Label htmlFor="log-sleep">Sono (horas)</Label><Input id="log-sleep" type="number" min="0" max="24" step="0.5" value={logForm.sleepHours} onChange={event => setLogForm(previous => ({ ...previous, sleepHours: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="log-fatigue">Fadiga (0–10)</Label><Input id="log-fatigue" type="number" min="0" max="10" step="1" value={logForm.fatigueScore} onChange={event => setLogForm(previous => ({ ...previous, fatigueScore: event.target.value }))} /><p className="text-xs text-muted-foreground">0 descansado; 10 exausto</p></div>
                <div className="space-y-2"><Label htmlFor="log-pain">Dor (0–10)</Label><Input id="log-pain" type="number" min="0" max="10" step="1" value={logForm.painScore} onChange={event => setLogForm(previous => ({ ...previous, painScore: event.target.value }))} /><p className="text-xs text-muted-foreground">0 sem dor; 10 dor máxima</p></div>
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>RPE (1-10)</Label><Input type="number" min="1" max="10" value={logForm.rpe} onChange={(e: any) => setLogForm((p: any) => ({ ...p, rpe: e?.target?.value ?? '' }))} /></div>
              <div className="space-y-2"><Label>Peso do Dia (kg)</Label><Input type="number" step="0.1" value={logForm.weight} onChange={(e: any) => setLogForm((p: any) => ({ ...p, weight: e?.target?.value ?? '' }))} /></div>
            </div>
            <div className="space-y-2"><Label>Observações</Label><Textarea value={logForm.notes} onChange={(e: any) => setLogForm((p: any) => ({ ...p, notes: e?.target?.value ?? '' }))} rows={2} /></div>
            {logError && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{logError}</p>}
            <Button onClick={handleLog} loading={saving} className="w-full">Salvar Registro</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
