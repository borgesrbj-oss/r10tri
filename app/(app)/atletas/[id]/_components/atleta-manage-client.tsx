'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Sparkles, RotateCcw, Trash2, Pencil, Plus, Waves, Bike, Timer, Dumbbell, MessageSquare, Send, BookOpen, ChevronDown, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';
import { SafeDate } from '@/components/safe-format';

const icons: Record<string, any> = { natacao: Waves, ciclismo: Bike, corrida: Timer, forca: Dumbbell };
const modLabels: Record<string, string> = { natacao: 'Natação', ciclismo: 'Ciclismo', corrida: 'Corrida', forca: 'Força', descanso: 'Descanso' };

export function AtletaManageClient({ athlete, plan, workouts, messages }: { athlete: any; plan: any; workouts: any[]; messages?: any[] }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [creatingManual, setCreatingManual] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleSendMessage = async () => {
    const text = msgText.trim();
    if (!text) { toast.error('Digite uma mensagem'); return; }
    setSendingMsg(true);
    try {
      const res = await fetch('/api/coach-message/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: athlete.id, message: text }) });
      const data = await res.json();
      if (res.ok) {
        toast.success('Mensagem enviada ao atleta');
        if (data?.waLink) window.open(data.waLink, '_blank');
        setMsgText('');
        router.refresh();
      } else toast.error(data?.error ?? 'Erro ao enviar');
    } catch { toast.error('Erro ao enviar'); } finally { setSendingMsg(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/plan/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUserId: athlete.id }) });
      const data = await res.json();
      if (res.ok) { toast.success(`Plano gerado com ${data?.workoutsCount ?? 0} treinos!`); router.refresh(); }
      else toast.error(data?.error ?? 'Erro ao gerar plano');
    } catch { toast.error('Erro ao gerar plano'); } finally { setGenerating(false); }
  };

  const handleCreateManual = async () => {
    setCreatingManual(true);
    try {
      const res = await fetch('/api/plan/create-manual', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUserId: athlete.id }) });
      const data = await res.json();
      if (res.ok) { toast.success('Plano manual criado! Adicione os treinos.'); router.refresh(); }
      else toast.error(data?.error ?? 'Erro ao criar plano');
    } catch { toast.error('Erro ao criar plano'); } finally { setCreatingManual(false); }
  };

  const handleDeletePlan = async () => {
    if (!plan?.id || !confirm('Excluir o plano e seus treinos deste atleta?')) return;
    const res = await fetch('/api/plan/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: plan.id }) });
    if (res.ok) { toast.success('Plano excluído'); router.refresh(); } else toast.error('Erro ao excluir');
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm('Excluir este treino?')) return;
    const res = await fetch('/api/workouts/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) { toast.success('Treino excluído'); router.refresh(); } else toast.error('Erro ao excluir');
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const isNew = !editing.id;
      const url = isNew ? '/api/workouts/create' : '/api/workouts/update';
      const body: any = isNew
        ? { targetUserId: athlete.id, planId: plan?.id, title: editing.title, description: editing.description, duration: editing.duration, targetZone: editing.targetZone, modality: editing.modality, date: editing.date, weekNumber: editing.weekNumber, phase: editing.phase }
        : { id: editing.id, title: editing.title, description: editing.description, duration: editing.duration, targetZone: editing.targetZone, modality: editing.modality, date: editing.date, weekNumber: editing.weekNumber, phase: editing.phase };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { toast.success('Treino salvo'); setEditing(null); router.refresh(); }
      else { const d = await res.json(); toast.error(d?.error ?? 'Erro ao salvar'); }
    } catch { toast.error('Erro ao salvar'); } finally { setSaving(false); }
  };

  const weeks = new Map<number, any[]>();
  for (const w of workouts ?? []) { const wn = w?.weekNumber ?? 1; if (!weeks.has(wn)) weeks.set(wn, []); weeks.get(wn)!.push(w); }

  const newWorkout = () => setEditing({ title: '', description: '', duration: 60, targetZone: 'Z2', modality: 'corrida', date: new Date().toISOString().slice(0, 10), weekNumber: 1, phase: 'base' });

  return (
    <div className="space-y-6">
      <FadeIn>
        <Link href="/atletas" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Voltar para atletas</Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-3">
            {athlete.photoUrl ? <Image src={athlete.photoUrl} alt={athlete.name} width={56} height={56} unoptimized className="h-14 w-14 rounded-full object-cover border-2 border-primary/40" /> : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-xl">{athlete.name.charAt(0).toUpperCase()}</div>}
            <div>
              <h1 className="font-display text-2xl tracking-tight font-bold">{athlete.name}</h1>
              <p className="text-sm text-muted-foreground">{athlete.email}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {plan && <Button variant="outline" size="sm" onClick={handleDeletePlan} className="text-destructive hover:text-destructive"><Trash2 className="mr-1.5 h-4 w-4" /> Excluir Plano</Button>}
            {!plan && <Button variant="outline" onClick={handleCreateManual} loading={creatingManual}><FileText className="mr-2 h-4 w-4" /> Criar Plano Manual</Button>}
            <Button onClick={handleGenerate} loading={generating}>{plan ? <><RotateCcw className="mr-2 h-4 w-4" /> Regenerar</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar Plano</>}</Button>
          </div>
        </div>
      </FadeIn>

      <FadeIn>
        <Card>
          <button type="button" onClick={() => setShowGuide((v) => !v)} className="w-full text-left">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Diretrizes para montar e ajustar a planilha
                <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${showGuide ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </button>
          {showGuide && (
            <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <div>
                <p className="font-medium text-foreground">Distribuição de intensidade (polarizado 80/20)</p>
                <p>Cerca de 80% do tempo em baixa intensidade (Z1–Z2, aeróbico, conversável) e ~20% em alta (Z3 ritmo/limiar inferior, Z4 limiar, Z5 VO₂máx). Nas <strong>primeiras semanas de base a carga intensa é ainda menor</strong> (adaptação): comece praticamente tudo em Z2 e introduza Z3 só na 2ª semana e Z4 a partir da 3ª. Zonas: <strong>Z1</strong> regenerativo · <strong>Z2</strong> aeróbico/base · <strong>Z3</strong> ritmo (tempo) · <strong>Z4</strong> limiar · <strong>Z5</strong> VO₂máx.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Volume semanal por distância-alvo</p>
                <p><strong>Super Sprint / Sprint</strong>: ~7–14 h (iniciante 5–8 h). <strong>Olímpico</strong>: ~9–16 h. <strong>70.3</strong>: ~10–18 h. <strong>Ironman</strong>: ~13–22 h+. Respeite o volume semanal do atleta (teto de horas e volume atual): nunca gere uma semana acima do limite dele, e aumente no máximo ~10% por semana (<strong>regra dos 10%</strong>).</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Divisão entre modalidades</p>
                <p>Do volume total: <strong>natação ~17–25%</strong>, <strong>ciclismo ~40–50%</strong> (maior fatia), <strong>corrida ~30–35%</strong>. Reduza a corrida se houver histórico de lesão de impacto. Atleta com natação fraca ganha mais com <strong>frequência + técnica</strong> do que com sessões longas.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Periodização (fases)</p>
                <p><strong>Base</strong>: volume aeróbico (Z2) e técnica, pouca intensidade. <strong>Construção</strong>: entra limiar (Z4) e ritmo de prova (Z3), inicia o brick (bike→corrida) semanal. <strong>Pico</strong>: intensidade específica (VO₂máx Z5, simulações de prova). <strong>Polimento (taper)</strong>: reduz volume ~30–60% nas últimas 2–3 semanas mantendo toques de intensidade para chegar descansado.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Recuperação e progressão</p>
                <p>Use ciclos <strong>3:1</strong> (3 semanas progredindo + 1 de recuperação com ~40% menos carga). Rebaixe Z4/Z5 para Z2 nas semanas de recuperação. Sono, alimentação e descanso fazem parte do treino — a adaptação acontece na recuperação.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Natação</p>
                <p>Prioridade em <strong>técnica e eficiência</strong>; use o ritmo CSS como referência. Mais vale <strong>frequência</strong> (sessões curtas e regulares) que poucas sessões longas, sobretudo no nível básico. Inclua educativos, séries curtas e trabalho de respiração/sighting para águas abertas.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Ciclismo</p>
                <p>Maior volume do programa. Base de <strong>Z2 longo</strong> + trabalho de <strong>FTP</strong> (watts) na construção/pico. É a modalidade mais segura para acumular carga aeróbica sem impacto — boa alternativa quando a corrida precisa ser limitada.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Corrida — baseada no teste de 3 km</p>
                <p>Ritmo de limiar derivado do teste de 3 km (média do 3k + ~18 s/km). Semana típica: 1 <strong>Longão (Z2)</strong>, 1 sessão de <strong>qualidade</strong> (Z4 limiar ou Z5 VO₂máx) e as demais em Z2. É a modalidade de <strong>maior impacto</strong> — controle o volume e priorize superfícies macias em caso de lesão articular. 5k/10k priorizam VO₂máx; 21k/42k priorizam limiar e Longão.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Força</p>
                <p>1–3 sessões/semana de força e mobilidade sustentam a performance e previnem lesão. Foque em padrões funcionais e core; reduza a carga perto da prova.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Estrutura por distância-alvo</p>
                <p><strong>Super Sprint / Sprint</strong>: volume menor, mas <strong>intensidade alta</strong> e <strong>transições/brick</strong> bem treinados — a prova é curta e rápida. <strong>Olímpico</strong>: equilíbrio entre resistência aeróbica e ritmo de limiar. <strong>70.3 / Ironman</strong>: foco em <strong>volume aeróbico</strong>, <strong>ritmo de prova</strong> sustentável, <strong>Longões</strong> (bike e corrida) e <strong>estratégia de nutrição/hidratação</strong> testada nos treinos longos.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Lesão de joelho (ex.: condropatia / patelar)</p>
                <p>Reduza <strong>volume e intensidade de corrida</strong> e priorize baixo impacto (bike/natação). Na força, prefira agachamento parcial (~60°), terra romeno, hip thrust, abdução com miniband e isometria (wall sit); <strong>evite</strong> agachamento profundo (&gt;90°), afundo profundo e cadeira extensora com carga alta. Mantenha a dor <strong>≤ 3/10</strong> durante e após o treino.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Como ajustar cada treino</p>
                <p>No botão de edição (lápis) você altera modalidade, data, duração, zona-alvo, fase, semana e a descrição completa. Use “Adicionar Treino” para inserir sessões e “Criar Plano Manual” para montar a planilha do zero.</p>
              </div>
            </CardContent>
          )}
        </Card>
      </FadeIn>

      <FadeIn>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Mensagens e Alertas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={3} value={msgText} onChange={(e: any) => setMsgText(e.target.value)} placeholder="Escreva um alerta ou recado para o atleta. Ele verá no app e você pode enviar também no WhatsApp." />
            <div className="flex justify-end">
              <Button onClick={handleSendMessage} loading={sendingMsg}><Send className="mr-2 h-4 w-4" /> Enviar{athlete.whatsapp ? ' + WhatsApp' : ''}</Button>
            </div>
            {(messages?.length ?? 0) > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Enviadas ({messages!.length})</p>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {messages!.map((m: any) => (
                    <div key={m.id} className="rounded-lg bg-muted/50 p-2.5">
                      <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                      <p className="text-[11px] text-muted-foreground mt-1"><SafeDate date={m.createdAt} options={{ dateStyle: 'short', timeStyle: 'short' }} locale="pt-BR" /> · {m.read ? 'Lida' : 'Não lida'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <div className="flex justify-between items-center">
        <p className="text-muted-foreground text-sm">{plan ? plan.name : 'Nenhum plano ativo para este atleta'}</p>
        {plan && <Button variant="outline" size="sm" onClick={newWorkout}><Plus className="mr-1.5 h-4 w-4" /> Adicionar Treino</Button>}
      </div>

      {!plan ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground space-y-4">
          <p>Nenhum plano ativo. Gere um plano automático, crie uma planilha manual do zero ou adicione treinos avulsos.</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button variant="outline" onClick={handleCreateManual} loading={creatingManual}><FileText className="mr-2 h-4 w-4" /> Criar Plano Manual</Button>
            <Button variant="outline" onClick={newWorkout}><Plus className="mr-2 h-4 w-4" /> Adicionar Treino</Button>
          </div>
        </CardContent></Card>
      ) : (
        Array.from(weeks.entries()).map(([weekNum, ws]) => (
          <Card key={weekNum}>
            <CardHeader className="pb-2"><CardTitle className="text-base">Semana {weekNum}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {ws.map((w: any) => {
                const Icon = icons[w?.modality] ?? Dumbbell;
                return (
                  <div key={w.id} className="flex items-center gap-3 border rounded-lg p-3">
                    <Icon className="h-5 w-5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{w.title}</p>
                      <p className="text-xs text-muted-foreground"><SafeDate date={w.date} options={{ weekday: 'short', day: 'numeric', month: 'short' }} locale="pt-BR" /> · {w.duration}min · {w.targetZone ?? ''} · {modLabels[w.modality] ?? w.modality}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing({ ...w, date: new Date(w.date).toISOString().slice(0, 10) })}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteWorkout(w.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={!!editing} onOpenChange={(o: boolean) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? 'Editar Treino' : 'Novo Treino'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1"><Label>Título</Label><Input value={editing.title} onChange={(e: any) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Modalidade</Label>
                  <select className="w-full h-9 rounded-md border bg-background px-3 text-sm" value={editing.modality} onChange={(e: any) => setEditing({ ...editing, modality: e.target.value })}>
                    {['natacao', 'ciclismo', 'corrida', 'forca', 'descanso'].map((m) => <option key={m} value={m}>{modLabels[m]}</option>)}
                  </select>
                </div>
                <div className="space-y-1"><Label>Data</Label><Input type="date" value={editing.date} onChange={(e: any) => setEditing({ ...editing, date: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Duração (min)</Label><Input type="number" value={editing.duration} onChange={(e: any) => setEditing({ ...editing, duration: e.target.value })} /></div>
                <div className="space-y-1"><Label>Zona</Label>
                  <select className="w-full h-9 rounded-md border bg-background px-3 text-sm" value={editing.targetZone ?? ''} onChange={(e: any) => setEditing({ ...editing, targetZone: e.target.value })}>
                    {['', 'Z1', 'Z2', 'Z3', 'Z4', 'Z5'].map((z) => <option key={z} value={z}>{z || '—'}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Fase</Label>
                  <select className="w-full h-9 rounded-md border bg-background px-3 text-sm" value={editing.phase ?? ''} onChange={(e: any) => setEditing({ ...editing, phase: e.target.value })}>
                    {[['', '—'], ['base', 'Base'], ['construcao', 'Construção'], ['pico', 'Pico'], ['polimento', 'Polimento']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-1"><Label>Semana</Label><Input type="number" min={1} value={editing.weekNumber ?? ''} onChange={(e: any) => setEditing({ ...editing, weekNumber: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label>Descrição</Label><Textarea rows={5} value={editing.description} onChange={(e: any) => setEditing({ ...editing, description: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
