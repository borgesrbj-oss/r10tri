'use client';
import {PlanningAudit} from '@/components/planning-audit';
import {stepPrescription,workoutPrescription,prescribedDistance} from '@/lib/training-prescription';
import { useState, useMemo } from 'react';
import { Table as TableIcon, Waves, Bike, Timer, Dumbbell, CheckCircle2, Circle, Download, CalendarCheck, Clock, Flame, CalendarRange, Send, KeyRound, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/ui/animate';
import { SafeDate } from '@/components/safe-format';
import { WorkoutStructure as WorkoutStructureView, TrainingDistributionSummary, getWorkoutStructure, formatTrainingDuration } from '@/components/workout-structure';
import Link from 'next/link';

const modLabels: Record<string, string> = { natacao: 'Natação', ciclismo: 'Ciclismo', corrida: 'Corrida', forca: 'Força', descanso: 'Descanso' };
const modIcons: Record<string, any> = { natacao: Waves, ciclismo: Bike, corrida: Timer, forca: Dumbbell };
const modColors: Record<string, string> = { natacao: '#3B82F6', ciclismo: '#F97316', corrida: '#22C55E', forca: '#A855F7', descanso: '#6B7280' };
const phaseLabels: Record<string, string> = { base: 'Base', build: 'Construção', peak: 'Pico', race: 'Prova', transition: 'Transição', construcao: 'Construção', pico: 'Pico', polimento: 'Polimento' };
const stepLabels: Record<string, string> = { aquecimento: 'Aquecimento', principal: 'Bloco principal', recuperacao: 'Recuperação', desaquecimento: 'Desaquecimento' };

function slugify(s: string) {
  return (s ?? 'planilha').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
}

function StatTile({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border bg-card/50 p-3 flex items-center gap-3">
      <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg shrink-0" style={{ backgroundColor: `${color}22` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight truncate">{value}</p>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}

const exportMods = [
  { key: 'todos', label: 'Plano completo' },
  { key: 'natacao', label: 'Natação' },
  { key: 'ciclismo', label: 'Ciclismo' },
  { key: 'corrida', label: 'Corrida' },
  { key: 'forca', label: 'Força' },
];

export function PlanilhaClient({ plan, workouts, hasIntervalsKey = false }: { plan: any; workouts: any[]; hasIntervalsKey?: boolean }) {
  const [filter, setFilter] = useState<string>('todos');
  const [exportModality, setExportModality] = useState<string>('todos');
  // Envio direto para o Intervals.icu (com horario 04:30)
  const [showKeyInput, setShowKeyInput] = useState<boolean>(!hasIntervalsKey);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [savingKey, setSavingKey] = useState<boolean>(false);
  const [pushing, setPushing] = useState<boolean>(false);
  const [pushMsg, setPushMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const summary = plan?.summary && typeof plan.summary === 'object' && !Array.isArray(plan.summary) ? plan.summary : null;
  const requiresCoachReview = summary?.requiresCoachReview === true || (workouts ?? []).some(workout => getWorkoutStructure(workout?.structure)?.requiresCoachReview === true);
  const planWarnings = [...new Set<string>([
    ...(Array.isArray(summary?.warnings) ? summary.warnings : []),
    ...(Array.isArray(summary?.weeks) ? summary.weeks.flatMap((week: any) => Array.isArray(week?.warnings) ? week.warnings : []) : []),
  ].filter((warning: unknown): warning is string => typeof warning === 'string' && warning.trim().length > 0))];

  const workoutExportDescription = (workout: any) => {
    const structure = getWorkoutStructure(workout?.structure);
    const lines = [String(workout?.description ?? '').trim()];
    if (structure) {
      lines.push('Blocos estruturados:');
      structure.steps.forEach((step, index) => lines.push(`${index + 1}. ${stepLabels[step.kind]}: ${step.label} · ${stepPrescription(structure,step,formatTrainingDuration)} · ${step.rest === 'passivo' ? 'pausa passiva' : step.zone || 'força/técnica'} · ${step.target.text}${step.rest === 'ativo' ? ' · recuperação ativa' : ''}`));
      lines.push(...(Array.isArray(structure.warnings) ? structure.warnings.filter((warning: unknown) => typeof warning === 'string').map(warning => `Atenção: ${warning}`) : []));
    }
    if (requiresCoachReview) lines.unshift('REVISÃO DO COACH NECESSÁRIA antes de executar este plano.');
    return lines.filter(Boolean).join('\n');
  };

  const saveIntervalsKey = async () => {
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    setPushMsg(null);
    try {
      const r = await fetch('/api/integrations/intervals/save-key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: apiKeyInput.trim() }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d?.hasKey) { setShowKeyInput(false); setApiKeyInput(''); setPushMsg({ type: 'ok', text: 'Chave salva com sucesso.' }); }
      else setPushMsg({ type: 'err', text: 'Não foi possível salvar a chave.' });
    } catch { setPushMsg({ type: 'err', text: 'Falha de conexão ao salvar a chave.' }); }
    finally { setSavingKey(false); }
  };

  const pushToIntervals = async () => {
    if (!plan?.id) return;
    setPushing(true);
    setPushMsg(null);
    try {
      const r = await fetch('/api/plan/push-intervals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: plan.id, modality: exportModality }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) setPushMsg({ type: 'ok', text: `${d.sent} treino(s) enviado(s) ao Intervals.icu às 04:30. Abra o calendário lá para conferir.` });
      else {
        if (d?.error === 'CHAVE_AUSENTE') { setShowKeyInput(true); }
        setPushMsg({ type: 'err', text: d?.message || 'Não foi possível enviar ao Intervals.icu.' });
      }
    } catch { setPushMsg({ type: 'err', text: 'Falha de conexão com o Intervals.icu.' }); }
    finally { setPushing(false); }
  };

  const downloadFullPlan = (platform: 'garmin' | 'mywhoosh', opts?: { mode?: 'zona' | 'km'; format?: 'fit' | 'tcx' }) => {
    if (!plan?.id) return;
    const params = new URLSearchParams({ planId: plan.id, platform, modality: exportModality });
    if (platform === 'garmin') {
      const format = opts?.format === 'tcx' ? 'tcx' : 'fit';
      params.set('format', format);
      if (format === 'fit') params.set('mode', opts?.mode === 'km' ? 'km' : 'zona');
    }
    const url = `/api/plan/export?${params.toString()}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const totalMin = (workouts ?? []).reduce((s: number, w: any) => s + (Number(w?.duration) || 0), 0);
  const totalTss = Math.round((workouts ?? []).reduce((s: number, w: any) => s + (Number(w?.tssEstimate) || 0), 0));
  const numWeeks = new Set((workouts ?? []).map((w: any) => w?.weekNumber).filter((n: any) => n != null)).size;
  const numTreinos = (workouts ?? []).length;

  const filtered = useMemo(() => {
    if (filter === 'todos') return workouts ?? [];
    return (workouts ?? []).filter((w: any) => w?.modality === filter);
  }, [workouts, filter]);

  const exportPdf = async () => {
    const jsPDFmod = await import('jspdf');
    const autoTableMod: any = await import('jspdf-autotable');
    const JsPDF = (jsPDFmod as any).jsPDF ?? (jsPDFmod as any).default;
    const autoTable = (autoTableMod as any).default ?? autoTableMod;
    const doc = new JsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text(plan?.name ?? 'Planilha de Treinos', 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text('Gotri - Nade. Pedale. Corra. Evolua.', 14, 22);
    const sorted = [...(workouts ?? [])].sort((a: any, b: any) => (a?.weekNumber ?? 0) - (b?.weekNumber ?? 0) || (new Date(a?.date ?? 0).getTime() - new Date(b?.date ?? 0).getTime()));
    const totalMin = sorted.reduce((s: number, w: any) => s + (Number(w?.duration) || 0), 0);
    const totalTss = sorted.reduce((s: number, w: any) => s + (Number(w?.tssEstimate) || 0), 0);
    doc.setTextColor(60);
    doc.text(`${sorted.length} treinos  •  ${Math.round(totalMin / 60)}h ${totalMin % 60}min totais  •  Carga (TSS): ${Math.round(totalTss)}`, 14, 26);
    const body = sorted.map((w: any) => [
      String(w?.weekNumber ?? ''),
      w?.date ? new Date(w.date).toLocaleDateString('pt-BR') : '',
      modLabels[w?.modality] ?? w?.modality ?? '',
      w?.title ?? '',
      workoutExportDescription(w),
      w?.duration ? workoutPrescription(w) : '',
      w?.targetZone ?? '',
      w?.tssEstimate != null ? String(Math.round(Number(w.tssEstimate))) : '',
      phaseLabels[w?.phase] ?? w?.phase ?? '',
      w?.completed ? 'Sim' : 'Não',
    ]);
    let startY = 32;
    if (requiresCoachReview || planWarnings.length > 0) {
      autoTable(doc, {
        body: [[[
          ...(requiresCoachReview ? ['REVISÃO DO COACH NECESSÁRIA: revise este plano com o treinador antes de executar os treinos.'] : []),
          ...planWarnings.map(warning => `Atenção: ${warning}`),
        ].join('\n')]],
        startY,
        styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak', textColor: [100, 65, 10], fillColor: [255, 248, 230] },
      });
      startY = (doc as any).lastAutoTable.finalY + 6;
    }
    autoTable(doc, {
      head: [['Sem.', 'Data', 'Modalidade', 'Treino', 'Descrição detalhada', 'Volume / tempo', 'Zona', 'TSS', 'Fase', 'OK']],
      body,
      startY,
      styles: { fontSize: 7.5, cellPadding: 2, valign: 'top', overflow: 'linebreak' },
      headStyles: { fillColor: [26, 138, 125], halign: 'left' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 42 },
        4: { cellWidth: 107 },
        5: { cellWidth: 16, halign: 'center' },
        6: { cellWidth: 12, halign: 'center' },
        7: { cellWidth: 12, halign: 'center' },
        8: { cellWidth: 20 },
        9: { cellWidth: 10, halign: 'center' },
      },
      didDrawPage: (data: any) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${data.pageNumber} de ${pageCount}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
      },
    });
    doc.save(`${slugify(plan?.name)}.pdf`);
  };

  const exportCsv = () => {
    const header = ['Semana', 'Data', 'Modalidade', 'Título', 'Tempo previsto (min)', 'Distância prescrita (km)', 'Zona', 'Fase', 'TSS', 'Concluído', 'Descrição detalhada', 'Revisão do coach', 'Avisos do plano'];
    const rows = (workouts ?? []).map((w: any) => [
      w?.weekNumber ?? '',
      w?.date ? new Date(w.date).toLocaleDateString('pt-BR') : '',
      modLabels[w?.modality] ?? w?.modality ?? '',
      w?.title ?? '',
      w?.duration ?? '',
      getWorkoutStructure(w?.structure)?.prescriptionMode==='distancia'?prescribedDistance(getWorkoutStructure(w.structure)!)/1000:'',
      w?.targetZone ?? '',
      phaseLabels[w?.phase] ?? w?.phase ?? '',
      w?.tssEstimate ?? '',
      w?.completed ? 'Sim' : 'Não',
      workoutExportDescription(w),
      requiresCoachReview ? 'Necessária antes da execução' : '',
      planWarnings.join('\n'),
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${slugify(plan?.name)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const modalities = ['todos', 'natacao', 'ciclismo', 'corrida', 'forca'];

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl tracking-tight font-bold flex items-center gap-2"><TableIcon className="h-7 w-7 text-primary" /> Planilha de Treinos</h1>
            <p className="text-muted-foreground">{plan ? plan.name : 'Visão em tabela do seu plano'}</p>
            <p className="text-xs text-muted-foreground mt-1">Tabela completa do seu plano para consultar, imprimir ou exportar.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" asChild>
              <Link href="/configurar-treino"><CalendarCheck className="mr-1.5 h-4 w-4" /> Dias de Treino</Link>
            </Button>
            {plan && (
              <>
                <Button variant="outline" size="sm" onClick={exportPdf}>
                  <Download className="mr-1.5 h-4 w-4" /> Exportar PDF
                </Button>
                <Button variant="outline" size="sm" onClick={exportCsv}>
                  <Download className="mr-1.5 h-4 w-4" /> Exportar CSV
                </Button>
              </>
            )}
          </div>
        </div>
      </FadeIn>

      {!plan ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <TableIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhum plano ativo</p>
          <p className="text-sm">Gere um plano na aba <Link href="/plano" className="text-primary hover:underline">Plano</Link> para ver a planilha.</p>
        </CardContent></Card>
      ) : (
        <>
          {(requiresCoachReview || planWarnings.length > 0) && (
            <section role={requiresCoachReview ? 'alert' : 'status'} className="rounded-xl border border-amber-500/50 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100 space-y-2" aria-label="Avisos do plano">
              {requiresCoachReview && <p className="font-semibold">Revisão do coach necessária antes de executar este plano. Converse com seu treinador sobre as condições e limitações informadas.</p>}
              {planWarnings.length > 0 && <ul className="list-disc space-y-1 pl-5">{planWarnings.map(warning => <li key={warning}>{warning}</li>)}</ul>}
            </section>
          )}
          <FadeIn>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile icon={CalendarCheck} label="Treinos" value={String(numTreinos)} color="#1A8A7D" />
              <StatTile icon={Clock} label="Volume total" value={`${Math.floor(totalMin / 60)}h ${totalMin % 60}min`} color="#3B82F6" />
              <StatTile icon={CalendarRange} label="Semanas" value={String(numWeeks)} color="#F97316" />
              <StatTile icon={Flame} label="Carga (TSS)" value={String(totalTss)} color="#EF4444" />
            </div>
          </FadeIn>

          {summary?.calculation?<PlanningAudit plan={plan} workouts={workouts??[]} />:<TrainingDistributionSummary workouts={workouts ?? []} title="Distribuição planejada por tempo ativo" />}

          <FadeIn>
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><Download className="h-5 w-5 text-primary" /> Enviar plano completo para MyWhoosh ou Garmin</CardTitle>
                <p className="text-sm text-muted-foreground">Escolha a modalidade e baixe o programa inteiro (todas as semanas) nos formatos nativos de cada plataforma. Ex.: "Corrida de 12 semanas". O arquivo ZIP inclui um guia de importação.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">1. Modalidade a exportar</p>
                  <div className="flex gap-2 flex-wrap">
                    {exportMods.map((m) => (
                      <Button key={m.key} variant={exportModality === m.key ? 'default' : 'outline'} size="sm" onClick={() => setExportModality(m.key)}>
                        {m.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">2. Baixar no formato da plataforma</p>

                  <p className="text-[11px] font-semibold text-foreground/80 mb-1">Garmin · .FIT <span className="font-normal text-muted-foreground">(para o relógio via USB)</span></p>
                  <div className="flex gap-2 flex-wrap mb-3">
                    <Button variant="secondary" size="sm" onClick={() => downloadFullPlan('garmin', { format: 'fit', mode: 'zona' })} className="bg-accent text-accent-foreground">
                      <Download className="mr-1.5 h-4 w-4" /> .FIT · blocos e alvos
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => downloadFullPlan('garmin', { format: 'fit', mode: 'km' })} className="bg-accent text-accent-foreground">
                      <Download className="mr-1.5 h-4 w-4" /> .FIT · por distância (km)
                    </Button>
                  </div>

                  <p className="text-[11px] font-semibold text-foreground/80 mb-1">Garmin · .TCX <span className="font-normal text-muted-foreground">(para o TrainingPeaks)</span></p>
                  <div className="flex gap-2 flex-wrap mb-3">
                    <Button variant="secondary" size="sm" onClick={() => downloadFullPlan('garmin', { format: 'tcx' })} className="bg-accent text-accent-foreground">
                      <Download className="mr-1.5 h-4 w-4" /> .TCX · blocos e alvos
                    </Button>
                  </div>

                  <p className="text-[11px] font-semibold text-foreground/80 mb-1">MyWhoosh / Zwift · .ZWO</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="secondary" size="sm" onClick={() => downloadFullPlan('mywhoosh')} className="bg-accent text-accent-foreground">
                      <Download className="mr-1.5 h-4 w-4" /> MyWhoosh / Zwift (.ZWO)
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">Cada download mantém os blocos e alvos disponíveis. Corridas geradas por km mantêm distâncias no FIT e no TCX. Pausas passivas continuam por tempo. Planos antigos com distância auxiliar usam o modo de exportação compatível. No ZIP Garmin, força sai em TXT e natação em FIT/TCX. No ZIP ZWO, natação e força saem em TXT. Alvos que o formato não suporta ficam nas notas. Se um treino exceder o limite de etapas do TCX, escolha FIT ou TXT.</p>
                  <p className="text-[11px] text-amber-500 mt-2"><strong>Atenção (Garmin):</strong> o site do Garmin Connect não importa treinos por arquivo — o menu Exercícios só permite criar à mão e a página "Importar Dados" é só para atividades concluídas. Use: <strong>(1)</strong> cabo USB — copie os <strong>.FIT</strong> para a pasta <strong>GARMIN/NewFiles</strong> do relógio (recomendado); ou <strong>(2) TrainingPeaks</strong> — importe o <strong>.TCX</strong> e sincronize com o Garmin; ou <strong>(3)</strong> recrie à mão em Treinam. e Planej. &gt; Exercícios. Passo a passo completo no arquivo COMO_IMPORTAR.txt dentro do ZIP.</p>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn>
            <Card className="border-accent/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><Send className="h-5 w-5 text-accent" /> Enviar direto para o Intervals.icu</CardTitle>
                <p className="text-sm text-muted-foreground">Publica os treinos (da modalidade selecionada acima) no seu calendário do Intervals.icu já com a <strong>data e o horário das 04:30</strong> — sem precisar baixar arquivo nem configurar nada. Reenviar atualiza os treinos sem duplicar.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {showKeyInput ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" /> Cole sua chave de API do Intervals.icu (uma única vez)</p>
                    <div className="flex gap-2 flex-wrap">
                      <Input type="password" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} placeholder="Chave de API do Intervals.icu" className="max-w-xs" autoComplete="off" />
                      <Button size="sm" onClick={saveIntervalsKey} disabled={savingKey || !apiKeyInput.trim()}>
                        {savingKey ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <KeyRound className="mr-1.5 h-4 w-4" />} Salvar chave
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">A chave fica em <strong>intervals.icu → Settings → Developer</strong> (seção "API Key"). Ela é guardada com segurança e usada só para enviar seus treinos ao seu calendário.</p>
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap items-center">
                    <Button size="sm" onClick={pushToIntervals} disabled={pushing} className="bg-accent text-accent-foreground">
                      {pushing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />} Enviar ao Intervals.icu (04:30)
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowKeyInput(true); setPushMsg(null); }}>
                      <KeyRound className="mr-1.5 h-4 w-4" /> Trocar chave
                    </Button>
                    <span className="text-[11px] text-muted-foreground">Chave configurada ✓</span>
                  </div>
                )}
                {pushMsg && (
                  <p className={`text-xs ${pushMsg.type === 'ok' ? 'text-emerald-500' : 'text-red-500'}`}>{pushMsg.text}</p>
                )}
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn>
            <div className="flex gap-2 flex-wrap">
              {modalities.map((m) => (
                <Button key={m} variant={filter === m ? 'secondary' : 'outline'} size="sm" onClick={() => setFilter(m)} className={filter === m ? 'bg-accent text-accent-foreground' : ''}>
                  {m === 'todos' ? 'Todos' : modLabels[m]}
                </Button>
              ))}
            </div>
          </FadeIn>

          <FadeIn>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{filtered.length} treino(s)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="px-4 py-2 font-medium">Sem.</th>
                        <th className="px-4 py-2 font-medium">Data</th>
                        <th className="px-4 py-2 font-medium">Modalidade</th>
                        <th className="px-4 py-2 font-medium">Treino</th>
                        <th className="px-4 py-2 font-medium text-center">Volume / tempo</th>
                        <th className="px-4 py-2 font-medium text-center">Zona</th>
                        <th className="px-4 py-2 font-medium">Fase</th>
                        <th className="px-4 py-2 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((w: any) => {
                        const Icon = modIcons[w?.modality] ?? Dumbbell;
                        const color = modColors[w?.modality] ?? '#6B7280';
                        return (
                          <tr key={w?.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                            <td className="px-4 py-2 font-mono text-muted-foreground">{w?.weekNumber ?? '-'}</td>
                            <td className="px-4 py-2 whitespace-nowrap"><SafeDate date={w?.date} options={{ weekday: 'short', day: 'numeric', month: 'short' }} locale="pt-BR" /></td>
                            <td className="px-4 py-2">
                              <span className="inline-flex items-center gap-1.5">
                                <Icon className="h-4 w-4 shrink-0" style={{ color }} />
                                <span className="hidden sm:inline">{modLabels[w?.modality] ?? w?.modality}</span>
                              </span>
                            </td>
                            <td className="px-4 py-2 min-w-[280px] max-w-xl">
                              <p className="font-medium">{w?.title}</p>
                              {getWorkoutStructure(w?.structure)?.requiresCoachReview && <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">Revisar com o coach antes da execução.</p>}
                              <details className="mt-2">
                                <summary className="cursor-pointer text-xs text-primary">Ver blocos, zonas e descansos</summary>
                                <div className="mt-3"><WorkoutStructureView value={w?.structure} description={w?.description} /></div>
                              </details>
                            </td>
                            <td className="px-4 py-2 text-center whitespace-nowrap font-mono">{workoutPrescription(w)}</td>
                            <td className="px-4 py-2 text-center">{w?.targetZone ? <Badge variant="outline">{w.targetZone}</Badge> : '-'}</td>
                            <td className="px-4 py-2 text-muted-foreground">{phaseLabels[w?.phase] ?? w?.phase ?? '-'}</td>
                            <td className="px-4 py-2 text-center">
                              {w?.completed
                                ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                                : <Circle className="h-4 w-4 text-muted-foreground/40 mx-auto" />}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </>
      )}
    </div>
  );
}
