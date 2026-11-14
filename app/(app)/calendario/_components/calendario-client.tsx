'use client';
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

const icons: Record<string, any> = { natacao: Waves, ciclismo: Bike, corrida: Timer, forca: Dumbbell };
const colors: Record<string, string> = { natacao: 'bg-blue-50 dark:bg-blue-950', ciclismo: 'bg-orange-50 dark:bg-orange-950', corrida: 'bg-green-50 dark:bg-green-950', forca: 'bg-purple-50 dark:bg-purple-950' };

export function CalendarioClient({ workouts }: { workouts: any[] }) {
  const [filter, setFilter] = useState('todos');
  const [logDialog, setLogDialog] = useState<any>(null);
  const [logForm, setLogForm] = useState({ actualDuration: '', actualDistance: '', rpe: '', weight: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const filtered = filter === 'todos' ? workouts : (workouts ?? []).filter((w: any) => w?.modality === filter);

  // Group by week
  const byWeek = new Map<string, any[]>();
  for (const w of filtered ?? []) {
    const d = new Date(w?.date);
    const ws = new Date(d);
    ws.setDate(d.getDate() - d.getDay() + 1);
    const key = ws.toISOString().slice(0, 10);
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(w);
  }

  const handleLog = async () => {
    if (!logDialog?.id) return;
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
        }),
      });
      if (res.ok) { toast.success('Treino registrado!'); setLogDialog(null); router.refresh(); }
      else toast.error('Erro ao registrar');
    } catch { toast.error('Erro ao registrar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-tight font-bold flex items-center gap-2"><Calendar className="h-7 w-7 text-primary" /> Calendário de Treinos</h1>
          <p className="text-muted-foreground">Visualize e registre seus treinos semanais</p>
        </div>
      </FadeIn>

      <div className="flex gap-2 flex-wrap">
        {[{ key: 'todos', label: 'Todos' }, { key: 'natacao', label: 'Natação' }, { key: 'ciclismo', label: 'Ciclismo' }, { key: 'corrida', label: 'Corrida' }].map((f: any) => (
          <Button key={f.key} variant={filter === f.key ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f.key)}>{f.label}</Button>
        ))}
      </div>

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
                      <div key={w?.id} className={`flex items-center gap-3 p-3 rounded-lg ${colors?.[w?.modality] ?? 'bg-muted/50'} ${w?.completed ? 'opacity-60' : ''}`}>
                        <Icon className="h-5 w-5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{w?.title}</p>
                          <p className="text-xs text-muted-foreground"><SafeDate date={w?.date} options={{ weekday: 'short', day: 'numeric', month: 'short' }} locale="pt-BR" /> · {w?.duration}min · {w?.targetZone ?? ''}</p>
                        </div>
                        {w?.completed ? (
                          <Badge variant="secondary" className="shrink-0"><CheckCircle2 className="h-3 w-3 mr-1" /> Feito</Badge>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => { setLogDialog(w); setLogForm({ actualDuration: String(w?.duration ?? ''), actualDistance: '', rpe: '', weight: '', notes: '' }); }}>
                            <ClipboardEdit className="h-4 w-4 mr-1" /> Registrar
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!logDialog} onOpenChange={(o: boolean) => !o && setLogDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Treino: {logDialog?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Duração Real (min)</Label><Input type="number" value={logForm.actualDuration} onChange={(e: any) => setLogForm((p: any) => ({ ...p, actualDuration: e?.target?.value ?? '' }))} /></div>
              <div className="space-y-2"><Label>Distância (km)</Label><Input type="number" step="0.1" value={logForm.actualDistance} onChange={(e: any) => setLogForm((p: any) => ({ ...p, actualDistance: e?.target?.value ?? '' }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>RPE (1-10)</Label><Input type="number" min="1" max="10" value={logForm.rpe} onChange={(e: any) => setLogForm((p: any) => ({ ...p, rpe: e?.target?.value ?? '' }))} /></div>
              <div className="space-y-2"><Label>Peso do Dia (kg)</Label><Input type="number" step="0.1" value={logForm.weight} onChange={(e: any) => setLogForm((p: any) => ({ ...p, weight: e?.target?.value ?? '' }))} /></div>
            </div>
            <div className="space-y-2"><Label>Observações</Label><Textarea value={logForm.notes} onChange={(e: any) => setLogForm((p: any) => ({ ...p, notes: e?.target?.value ?? '' }))} rows={2} /></div>
            <Button onClick={handleLog} loading={saving} className="w-full">Salvar Registro</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
