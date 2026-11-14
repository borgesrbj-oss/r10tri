'use client';
import { useState } from 'react';
import { useCurrentTime } from '@/hooks/use-browser-state';
import { Target, Plus, Trash2, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FadeIn, Stagger, StaggerItem, HoverLift } from '@/components/ui/animate';
import { SafeDate } from '@/components/safe-format';

const distanceLabels: Record<string, string> = { supersprint: 'Super Sprint', sprint: 'Sprint', olimpico: 'Olímpico', '70.3': 'Half Ironman', ironman: 'Ironman', '5k': '5 km', '10k': '10 km', '21k': '21 km (Meia)', '42k': '42 km (Maratona)' };
const distanceColors: Record<string, string> = { supersprint: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200', sprint: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', olimpico: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', '70.3': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', ironman: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', '5k': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200', '10k': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200', '21k': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', '42k': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' };

export function ProvasClient({ races }: { races: any[] }) {
  const now = useCurrentTime();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [distance, setDistance] = useState('olimpico');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleAdd = async () => {
    if (!name || !date) { toast.error('Preencha nome e data'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/races', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, date, distance, notes }) });
      if (res.ok) { toast.success('Prova cadastrada!'); setOpen(false); setName(''); setDate(''); setNotes(''); router.refresh(); }
      else toast.error('Erro ao cadastrar');
    } catch { toast.error('Erro ao cadastrar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta prova?')) return;
    const res = await fetch('/api/races/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) { toast.success('Prova removida'); router.refresh(); }
  };

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl tracking-tight font-bold flex items-center gap-2"><Target className="h-7 w-7 text-primary" /> Provas-Alvo</h1>
            <p className="text-muted-foreground">Cadastre suas competições para orientar a periodização</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Nova Prova</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Cadastrar Prova</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Nome da Prova</Label><Input value={name} onChange={(e: any) => setName(e?.target?.value ?? '')} placeholder="Ex.: Ironman 70.3 Florianópolis" /></div>
                <div className="space-y-2"><Label>Data</Label><Input type="date" value={date} onChange={(e: any) => setDate(e?.target?.value ?? '')} /></div>
                <div className="space-y-2">
                  <Label>Distância</Label>
                  <Select value={distance} onValueChange={setDistance}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supersprint">Super Sprint (Triatlo)</SelectItem>
                      <SelectItem value="sprint">Sprint (Triatlo)</SelectItem>
                      <SelectItem value="olimpico">Olímpico (Triatlo)</SelectItem>
                      <SelectItem value="70.3">Half Ironman 70.3 (Triatlo)</SelectItem>
                      <SelectItem value="ironman">Ironman (Triatlo)</SelectItem>
                      <SelectItem value="5k">Corrida 5 km</SelectItem>
                      <SelectItem value="10k">Corrida 10 km</SelectItem>
                      <SelectItem value="21k">Corrida 21 km (Meia Maratona)</SelectItem>
                      <SelectItem value="42k">Corrida 42 km (Maratona)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Observações</Label><Input value={notes} onChange={(e: any) => setNotes(e?.target?.value ?? '')} placeholder="Opcional" /></div>
                <Button onClick={handleAdd} loading={saving} className="w-full">Cadastrar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </FadeIn>

      {(races?.length ?? 0) === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground"><Target className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Nenhuma prova cadastrada ainda</p><p className="text-sm">Clique em &quot;Nova Prova&quot; para começar</p></CardContent></Card>
      ) : (
        <Stagger staggerDelay={0.05}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {races?.map((race: any) => {
              const daysLeft = now === null ? null : Math.ceil((new Date(race?.date).getTime() - now) / (1000 * 60 * 60 * 24));
              const isPast = daysLeft !== null && daysLeft < 0;
              return (
                <StaggerItem key={race?.id}>
                  <HoverLift>
                    <Card className={isPast ? 'opacity-60' : ''}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <Badge className={distanceColors?.[race?.distance] ?? ''}>{distanceLabels?.[race?.distance] ?? race?.distance}</Badge>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(race?.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{race?.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> <SafeDate date={race?.date} options={{ dateStyle: 'long' }} locale="pt-BR" /></p>
                        <div className="mt-3">
                          {isPast ? <Badge variant="secondary">Concluída</Badge> : <Badge variant={daysLeft !== null && daysLeft <= 30 ? 'destructive' : 'outline'}>{daysLeft ?? '—'} dias restantes</Badge>}
                        </div>
                        {race?.notes && <p className="text-xs text-muted-foreground mt-2">{race.notes}</p>}
                      </CardContent>
                    </Card>
                  </HoverLift>
                </StaggerItem>
              );
            })}
          </div>
        </Stagger>
      )}
    </div>
  );
}
