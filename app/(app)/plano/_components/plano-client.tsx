'use client';
import {PlanningAudit} from '@/components/planning-audit';
import {workoutPrescription} from '@/lib/training-prescription';
import { assessmentIssues, type AssessmentIssue } from '@/lib/assessment-review';
import { AssessmentReview } from '@/components/assessment-review';
import {SeasonSummary} from '@/components/season-summary';

import { useState } from 'react';
import { useLocalDate } from '@/hooks/use-browser-state';
import { Dumbbell, Waves, Bike, Timer, Sparkles, Download, CheckCircle2, RotateCcw, ClipboardEdit, Activity, Trash2, ExternalLink, Apple, CalendarCheck, Clock, Flame, CalendarRange, ChevronRight, CalendarDays, List } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FadeIn } from '@/components/ui/animate';
import { SafeDate } from '@/components/safe-format';
import { CoachQuestionnaire } from './coach-questionnaire';
import { TrainingDistributionSummary, WorkoutStructure, WorkoutWhatsappLink } from '@/components/workout-structure';
import { TrainingZonesSummary } from '@/components/training-zones-summary';
import { RacePrediction } from '@/components/race-prediction';

const icons: Record<string, any> = { natacao: Waves, ciclismo: Bike, corrida: Timer, forca: Dumbbell };
const colors: Record<string, string> = { natacao: 'border-l-blue-500', ciclismo: 'border-l-orange-500', corrida: 'border-l-green-500', forca: 'border-l-purple-500' };
const modLabels: Record<string, string> = { natacao: 'Natação', ciclismo: 'Ciclismo', corrida: 'Corrida', forca: 'Força' };
const phaseLabels: Record<string, string> = { base: 'Base', build: 'Construção', peak: 'Pico', race: 'Prova', transition: 'Transição', construcao: 'Construção', pico: 'Pico', polimento: 'Polimento' };
const phaseColors: Record<string, string> = { base: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', build: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', peak: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', race: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', transition: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', construcao: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', pico: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', polimento: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };

async function serverWorkoutExport(w: any, format: 'zwo' | 'txt', appName?: string) {
  if (!w?.id) { toast.error('O treino precisa estar salvo antes de exportar.'); return; }
  try {
    const response = await fetch(`/api/workouts/export?id=${encodeURIComponent(w.id)}&format=${format}`);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      toast.error(data?.error || 'Não foi possível exportar o treino.'); return;
    }
    if (response.headers.get('Content-Type')?.includes('text/html')) { toast.error('Entre novamente antes de exportar o treino.'); return; }
    download(await response.blob(), `${slugify(w.title)}.${format}`, response.headers.get('Content-Type') || 'application/octet-stream');
    toast.success(`Arquivo .${format.toUpperCase()} preparado${appName ? ` para o ${appName}` : ''}.`);
  } catch { toast.error('Falha de conexão ao exportar. Tente novamente quando estiver online.'); }
}

function exportZwo(w: any, appName?: string) {
  return serverWorkoutExport(w, 'zwo', appName);
}

// Garmin Connect: baixa o arquivo .FIT estruturado (importar em Connect > Treinos)
// mode='zona' -> passos com alvo por zona de FC; mode='km' -> passos por distância (corrida).
function fitDownload(w: any, mode: 'zona' | 'km') {
  if (typeof window === 'undefined') return;
  const a = document.createElement('a');
  a.href = `/api/workouts/fit?id=${w?.id}&mode=${mode}`;
  a.download = `${slugify(w?.title)}_${mode === 'km' ? 'km' : 'fc'}.fit`;
  a.click();
  toast.success(mode === 'km'
    ? 'Arquivo .FIT (por distância/km) baixado! Importe em Garmin Connect > Treinos.'
    : 'Arquivo .FIT com os alvos disponíveis baixado. Copie para GARMIN/NewFiles no aparelho compatível.');
}

// MyWhoosh: baixa o .ZWO e abre o Workout Builder para importar
function importMyWhoosh(w: any) {
  exportZwo(w, 'MyWhoosh');
  if (typeof window !== 'undefined') window.open('https://event.mywhoosh.com/', '_blank', 'noopener,noreferrer');
}

// Zwift: baixa o .ZWO (copiar para a pasta Workouts do Zwift)
function importZwift(w: any) {
  exportZwo(w, 'Zwift');
}

// Rouvy: baixa o .ZWO (importar no app Rouvy)
function importRouvy(w: any) {
  exportZwo(w, 'Rouvy');
  if (typeof window !== 'undefined') window.open('https://rouvy.com/', '_blank', 'noopener,noreferrer');
}

// Baixar em PDF: gera um PDF do treino individual
async function exportWorkoutPdf(w: any) {
  const jsPDFmod = await import('jspdf');
  const JsPDF = (jsPDFmod as any).jsPDF ?? (jsPDFmod as any).default;
  const doc = new JsPDF();
  const mod = modLabels[w?.modality] ?? w?.modality;
  doc.setFontSize(16);
  doc.text(`${mod}: ${w?.title ?? 'Treino'}`, 14, 18);
  doc.setFontSize(10);
  const meta = [
    `Data: ${w?.date ? new Date(w.date).toLocaleDateString('pt-BR') : ''}`,
    `Duração: ${w?.duration ?? 0} min   ·   Zona-alvo: ${w?.targetZone ?? 'N/A'}`,
    `Fase: ${phaseLabels[w?.phase] ?? w?.phase ?? ''}   ·   Carga (TSS): ${w?.tssEstimate ?? 'N/A'}`,
  ];
  doc.text(meta, 14, 28);
  doc.setFontSize(12);
  doc.text('Descrição do treino:', 14, 48);
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(String(w?.description ?? ''), 180);
  let lineY = 56;
  for (const line of lines) {
    if (lineY > 280) { doc.addPage(); lineY = 20; }
    doc.text(line, 14, lineY); lineY += 5;
  }
  doc.save(`${slugify(w?.title)}.pdf`);
  toast.success('PDF do treino baixado!');
}

function exportWorkoutTxt(w: any) {
  return serverWorkoutExport(w, 'txt');
}

function slugify(s: string) {
  return (s ?? 'treino').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
}

function download(content: string | Blob, filename: string, mime: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  // Dá tempo para o navegador iniciar o download antes de liberar a URL local.
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function ZonesSummary({profile}:{profile:any}) { return <FadeIn><TrainingZonesSummary profile={profile} /></FadeIn>; }

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

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function CalendarView({ workouts, onSelect }: { workouts: any[]; onSelect: (w: any) => void }) {
  const byDay = new Map<string, any[]>();
  const dates: Date[] = [];
  for (const w of workouts) {
    if (!w?.date) continue;
    const d = new Date(w.date);
    if (isNaN(d.getTime())) continue;
    dates.push(d);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(w);
  }
  if (dates.length === 0) return null;
  dates.sort((a, b) => a.getTime() - b.getTime());
  const first = dates[0];
  const last = dates[dates.length - 1];
  const months: { year: number; month: number }[] = [];
  const cur = new Date(first.getFullYear(), first.getMonth(), 1);
  const end = new Date(last.getFullYear(), last.getMonth(), 1);
  while (cur <= end) { months.push({ year: cur.getFullYear(), month: cur.getMonth() }); cur.setMonth(cur.getMonth() + 1); }

  return (
    <div className="space-y-6">
      {months.map(({ year, month }) => {
        const firstDow = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells: (number | null)[] = [];
        for (let i = 0; i < firstDow; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        return (
          <Card key={`${year}-${month}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{MONTH_NAMES[month]} {year}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAY_NAMES.map((wd) => (
                  <div key={wd} className="text-center text-[11px] font-medium text-muted-foreground py-1">{wd}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((d, i) => {
                  if (d === null) return <div key={`e${i}`} className="min-h-[70px] rounded-md" />;
                  const items = byDay.get(`${year}-${month}-${d}`) ?? [];
                  return (
                    <div key={`d${i}`} className="min-h-[70px] rounded-md border bg-card/40 p-1 flex flex-col gap-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground px-0.5">{d}</span>
                      {items.map((w: any) => {
                        const Icon = icons?.[w?.modality] ?? Dumbbell;
                        return (
                          <button
                            key={w?.id}
                            onClick={() => onSelect(w)}
                            title={w?.title}
                            className={`text-left text-[10px] rounded border-l-2 ${colors?.[w?.modality] ?? 'border-l-gray-300'} bg-muted/60 hover:bg-muted px-1 py-0.5 flex items-center gap-1 ${w?.completed ? 'opacity-50' : ''}`}
                          >
                            <Icon className="h-3 w-3 shrink-0" />
                            <span className="truncate">{modLabels?.[w?.modality] ?? w?.modality}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function PlanoClient({ plan, workouts, profile, races }: { plan: any; workouts: any[]; profile: any; races: any[] }) {
  const [generating, setGenerating] = useState(false);
  const [reviewIssues,setReviewIssues]=useState<AssessmentIssue[]>([]);
  const [reviewField,setReviewField]=useState<string>();
  const [generationErrors, setGenerationErrors] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [modFilter, setModFilter] = useState<string | null>(null);
  const [showGenOptions, setShowGenOptions] = useState(false);
  const [genModality, setGenModality] = useState<string>(profile?.modality ?? 'triatlo');
  const [genGoal, setGenGoal] = useState<string>(plan?.summary?.goal ?? '');
  const [genRunStructure, setGenRunStructure] = useState<string>(profile?.runStructure ?? 'zona');
  const [genStartDate, setGenStartDate] = useState<string>('');
  const [genWeeks, setGenWeeks] = useState<string>('');
  const [viewMode, setViewMode] = useState<'lista' | 'calendario'>('lista');
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [garminW, setGarminW] = useState<any>(null);
  const todayStr = useLocalDate();
  const router = useRouter();

  const RUN_GOALS = [
    {key:'iniciacao',label:'Iniciação'},{key:'retorno',label:'Retorno gradual'},
    { key: 'pace', label: 'Melhorar o pace' },
    { key: '5k', label: '5 km' },
    { key: '10k', label: '10 km' },
    { key: '15k', label: '15 km' },
    { key: '21k', label: '21 km (meia)' },
    { key: '42k', label: '42 km (maratona)' },
  ];
  const TRI_GOALS = [
    { key: 'supersprint', label: 'Super Sprint' },
    { key: 'sprint', label: 'Sprint' },
    { key: 'olimpica', label: 'Olímpica' },
    { key: '70.3', label: 'Ironman 70.3' },
    { key: 'ironman', label: 'Ironman' },
  ];

  const MODALITY_OPTIONS = [
    { key: 'triatlo', label: 'Triatlo', icon: Activity },
    { key: 'natacao', label: 'Natação', icon: Waves },
    { key: 'ciclismo', label: 'Ciclismo', icon: Bike },
    { key: 'corrida', label: 'Corrida', icon: Timer },
  ];

  const needsAssessment = !profile?.coachAssessmentDone;

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm('Excluir este treino?')) return;
    try {
      const res = await fetch('/api/workouts/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (res.ok) { toast.success('Treino excluído'); router.refresh(); }
      else toast.error('Erro ao excluir treino');
    } catch { toast.error('Erro ao excluir treino'); }
  };

  const handleDeletePlan = async () => {
    if (!plan?.id) return;
    if (!confirm('Excluir todo o plano e seus treinos? Esta ação não pode ser desfeita.')) return;
    try {
      const res = await fetch('/api/plan/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: plan.id }) });
      if (res.ok) { toast.success('Plano excluído'); router.refresh(); }
      else toast.error('Erro ao excluir plano');
    } catch { toast.error('Erro ao excluir plano'); }
  };

  const WEEKS_OPTIONS = [6, 8, 12, 16, 20, 24];

  const handleGenerate = async (opts?: { modality?: string; advanced?: boolean; goal?: string; structure?: string; startDate?: string; weeks?: number }) => {
    setGenerationErrors([]);
    setReviewIssues([]);
    setGenerating(true);
    try {
      const res = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts ?? {}),
      });
      const data = await res.json();
      if (res.ok) {
        const via = data?.generatedBy === 'ai-avancada' ? 'IA Avançada' : data?.generatedBy === 'ai' ? 'IA' : 'gerador automático';
        toast.success(`Plano gerado com ${data?.workoutsCount ?? 0} treinos (via ${via})! Abrindo sua planilha...`);
        router.push('/planilha');
        router.refresh();
      } else {
        const details = Array.isArray(data?.details) ? data.details.map((detail: unknown) => typeof detail === 'string' ? detail : detail && typeof detail === 'object' && 'message' in detail && typeof detail.message === 'string' ? detail.message : '').filter(Boolean) : [];
        const message = data?.error || 'Não foi possível gerar o plano.';
        setGenerationErrors([message, ...details]);
        setReviewIssues(assessmentIssues(data?.assessmentIssues));
        toast.error(message);
      }
    } catch { setGenerationErrors(['Falha de conexão. Seus planos anteriores foram preservados; tente novamente quando estiver online.']); toast.error('Erro ao gerar plano'); }
    finally { setGenerating(false); }
  };

  const confirmGenerate = () => {
    setShowGenOptions(false);
    handleGenerate({ modality: genModality, goal: genGoal || undefined, structure: genModality === 'corrida' ? genRunStructure : undefined, startDate: genStartDate || undefined, weeks: genWeeks ? Number(genWeeks) : undefined });
  };

  const handleAssessmentComplete = async (opts?: { startDate?: string; weeks?: number }) => {
    await handleGenerate(opts);
  };

  // Show questionnaire if assessment not done or user clicked "Refazer Avaliação"
  if (needsAssessment || showQuestionnaire) {
    return <CoachQuestionnaire profile={{...profile,runStructure:genRunStructure}} races={races} generationErrors={generationErrors} generationIssues={reviewIssues} reviewField={reviewField} onComplete={handleAssessmentComplete} />;
  }

  // Estatísticas do plano (todos os treinos)
  const totalMin = (workouts ?? []).reduce((s: number, w: any) => s + (Number(w?.duration) || 0), 0);
  const totalTss = Math.round((workouts ?? []).reduce((s: number, w: any) => s + (Number(w?.tssEstimate) || 0), 0));
  const numWeeks = new Set((workouts ?? []).map((w: any) => w?.weekNumber).filter((n: any) => n != null)).size;
  const numTreinos = (workouts ?? []).length;

  // Modalidades presentes no plano
  const presentMods = Array.from(new Set((workouts ?? []).map((w: any) => w?.modality).filter(Boolean)));
  // Filtro por modalidade
  const filtered = (workouts ?? []).filter((w: any) => !modFilter || w?.modality === modFilter);

  // Group by week
  const weeks = new Map<number, any[]>();
  for (const w of filtered) {
    const wn = w?.weekNumber ?? 1;
    if (!weeks.has(wn)) weeks.set(wn, []);
    weeks.get(wn)!.push(w);
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl tracking-tight font-bold flex items-center gap-2"><Dumbbell className="h-7 w-7 text-primary" /> Plano de Treino</h1>
            <p className="text-muted-foreground">{plan ? plan.name : 'Gere um plano personalizado gratuito'}</p>
            <p className="text-xs text-muted-foreground mt-1">Seu programa semana a semana. Toque em um treino para ver os detalhes e exportar.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" asChild>
              <Link href="/configurar-treino"><CalendarCheck className="mr-1.5 h-4 w-4" /> Dias de Treino</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowQuestionnaire(true)}>
              <ClipboardEdit className="mr-1.5 h-4 w-4" /> Refazer Avaliação
            </Button>
            {plan && (
              <Button variant="outline" size="sm" onClick={handleDeletePlan} className="text-destructive hover:text-destructive">
                <Trash2 className="mr-1.5 h-4 w-4" /> Excluir Plano
              </Button>
            )}
            <Button onClick={() => { setGenModality(profile?.modality ?? 'triatlo'); setGenStartDate(new Date().toLocaleDateString('en-CA')); setGenWeeks(races?.length > 0 ? '' : '12'); setShowGenOptions(true); }} loading={generating} size="lg">
              {plan ? <><RotateCcw className="mr-2 h-4 w-4" /> Novo Plano</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar Plano</>}
            </Button>
          </div>
        </div>
      </FadeIn>

      {generationErrors.length > 0 && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm"><p className="font-semibold">Confira os dados antes de gerar o plano</p><ul className="mt-2 list-disc space-y-1 pl-4">{generationErrors.map((message, index) => <li key={index}>{message}</li>)}</ul></div>}

      <AssessmentReview issues={reviewIssues} onReview={issue=>{if(issue.field==='raceDate'){router.push('/provas');return;}setReviewField(issue.field);setShowQuestionnaire(true);}} />

      <Dialog open={showGenOptions} onOpenChange={setShowGenOptions}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Gerar plano</DialogTitle>
            <DialogDescription>Escolha a modalidade. O plano é montado automaticamente, com periodização completa até a prova — totalmente gratuito, sem consumir créditos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary" /> Dia de início do plano</p>
              <input
                type="date"
                value={genStartDate}
                min={todayStr}
                onChange={(e) => setGenStartDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">O primeiro treino cairá a partir deste dia, respeitando os seus dias de treino.</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1.5"><CalendarRange className="h-4 w-4 text-primary" /> Quantas semanas de treino</p>
              <div className="grid grid-cols-3 gap-2">
                {races?.length > 0 && (
                  <Button type="button" variant={genWeeks === '' ? 'default' : 'outline'} size="sm" onClick={() => setGenWeeks('')} className="justify-center col-span-3">Auto (até a prova)</Button>
                )}
                {WEEKS_OPTIONS.map((n) => (
                  <Button key={n} type="button" variant={genWeeks === String(n) ? 'default' : 'outline'} size="sm" onClick={() => setGenWeeks(String(n))} className="justify-center">{n} sem</Button>
                ))}
              </div>
                <p className="text-xs text-muted-foreground">{races?.length > 0 ? 'Em “Auto”, inclui a próxima prova e a transição, até 52 semanas.' : 'Escolha a duração do seu ciclo de treino.'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Modalidade</p>
              <div className="grid grid-cols-2 gap-2">
                {MODALITY_OPTIONS.map((m) => {
                  const Icon = m.icon;
                  return (
                    <Button key={m.key} type="button" variant={genModality === m.key ? 'default' : 'outline'} onClick={() => { setGenModality(m.key); setGenGoal(''); }} className="justify-start">
                      <Icon className="mr-2 h-4 w-4" /> {m.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            {genModality && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Objetivo do planejamento</p>
                <div className="grid grid-cols-2 gap-2">
                  {(genModality === 'corrida' ? RUN_GOALS : genModality==='triatlo'?TRI_GOALS:genModality==='ciclismo'?[{key:'base',label:'Base aeróbica'},{key:'ftp',label:'Desenvolver FTP'},{key:'endurance',label:'Longa duração'}]:[{key:'tecnica',label:'Técnica e adaptação'},{key:'css',label:'Desenvolver CSS'},{key:'velocidade',label:'Velocidade'},{key:'aguas_abertas',label:'Águas abertas'}]).map((g) => (
                    <Button key={g.key} type="button" variant={genGoal === g.key ? 'default' : 'outline'} size="sm" onClick={() => setGenGoal(g.key)} className="justify-start">
                      {g.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">O objetivo ajusta a duração das sessões e o tipo de intervalo dentro da sua disponibilidade. Provas longas exigem revisão individual do coach.</p>
              </div>
            )}
            {genModality === 'corrida' && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Estruturar treino por</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant={genRunStructure === 'zona' ? 'default' : 'outline'} size="sm" onClick={() => setGenRunStructure('zona')} className="justify-start">
                    <Activity className="mr-2 h-4 w-4" /> Zona de FC
                  </Button>
                  <Button type="button" variant={genRunStructure === 'distancia' ? 'default' : 'outline'} size="sm" onClick={() => setGenRunStructure('distancia')} className="justify-start">
                    <Timer className="mr-2 h-4 w-4" /> Distância (km)
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">FC usa o limiar funcional informado e monitor. Sem esses dados, usa pace de limiar ou percepção. Distâncias são estimadas pelo pace; o tempo total continua sendo o limite da sessão.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenOptions(false)}>Cancelar</Button>
            <Button onClick={confirmGenerate} loading={generating}><Sparkles className="mr-2 h-4 w-4" /> Gerar Plano</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RacePrediction profile={profile} />

      {!plan ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhum plano ativo</p>
          <p className="text-sm">Cadastre suas provas e clique em &quot;Gerar Plano&quot;</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          <FadeIn>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile icon={CalendarCheck} label="Treinos" value={String(numTreinos)} color="#1A8A7D" />
              <StatTile icon={Clock} label="Volume total" value={`${Math.floor(totalMin / 60)}h ${totalMin % 60}min`} color="#3B82F6" />
              <StatTile icon={CalendarRange} label="Semanas" value={String(numWeeks)} color="#F97316" />
              <StatTile icon={Flame} label="Carga (TSS)" value={workouts.length>0&&workouts.every(w=>w.tssEstimate!=null)?String(totalTss):'Sem estimativa'} color="#EF4444" />
            </div>
          </FadeIn>
          {plan?.summary?.calculation?<PlanningAudit plan={plan} workouts={workouts} />:<><SeasonSummary workouts={workouts} /><TrainingDistributionSummary workouts={workouts.filter(w=>!w.paused)} title="Distribuição planejada do plano" /></>}
          {plan?.nutritionPlan && (
            <FadeIn>
              <Link href="/nutricao" className="block">
                <Card className="border-l-4 border-l-emerald-500 hover:bg-muted/40 transition-colors">
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg shrink-0 bg-emerald-500/15">
                      <Apple className="h-5 w-5 text-emerald-500" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">Plano Alimentar</p>
                      <p className="text-xs text-muted-foreground">Veja sua estratégia de nutrição na aba Nutrição.</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            </FadeIn>
          )}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border p-0.5 bg-card/50">
              <button
                onClick={() => setViewMode('lista')}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${viewMode === 'lista' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List className="h-4 w-4" /> Lista
              </button>
              <button
                onClick={() => setViewMode('calendario')}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${viewMode === 'calendario' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <CalendarDays className="h-4 w-4" /> Calendário
              </button>
            </div>
          </div>
          {presentMods.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setModFilter(null)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!modFilter ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>Todos</button>
              {presentMods.map((m: any) => {
                const MIcon = icons?.[m] ?? Dumbbell;
                return (
                  <button key={m} onClick={() => setModFilter(m)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${modFilter === m ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                    <MIcon className="h-3.5 w-3.5" /> {modLabels?.[m] ?? m}
                  </button>
                );
              })}
            </div>
          )}
          {viewMode === 'calendario' ? (
            <CalendarView workouts={filtered} onSelect={setSelectedWorkout} />
          ) : Array.from(weeks.entries()).map(([weekNum, weekWorkouts]) => (
            <FadeIn key={weekNum} delay={weekNum * 0.02}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>Semana {weekNum}</span>
                    {weekWorkouts?.[0]?.phase && <Badge className={phaseColors?.[weekWorkouts[0].phase] ?? ''}>{phaseLabels?.[weekWorkouts[0].phase] ?? weekWorkouts[0].phase}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!plan?.summary?.calculation&&<div className="mb-3"><TrainingDistributionSummary workouts={(workouts ?? []).filter((workout: any) => (workout.weekNumber ?? 1) === weekNum)} title={`Tempo ativo da semana ${weekNum} · todas as modalidades`} compact /></div>}
                  <div className="space-y-2">
                    {weekWorkouts?.map((w: any) => {
                      const Icon = icons?.[w?.modality] ?? Dumbbell;
                      const isExpanded = expanded === w?.id;
                      return (
                        <div key={w?.id} className={`border-l-4 ${colors?.[w?.modality] ?? 'border-l-gray-300'} rounded-lg p-3 hover:bg-muted/50 transition-colors ${w?.completed ? 'opacity-60' : ''}`}>
                          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                            <button type="button" className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={isExpanded} aria-controls={`workout-details-${w.id}`} onClick={() => setExpanded(isExpanded ? null : w.id)}>
                            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span className="truncate text-sm font-medium">{w?.title}</span>
                                {w?.completed && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                              </span>
                              <span className="block text-xs text-muted-foreground"><SafeDate date={w?.date} options={{ weekday: 'short', day: 'numeric', month: 'short' }} locale="pt-BR" /> · {workoutPrescription(w)} · {w?.targetZone ?? ''}</span>
                            </span>
                            </button>
                            <div className="flex w-full shrink-0 flex-wrap justify-end gap-1 sm:w-auto">
                              {/* Garmin Connect (.FIT) — todas as modalidades esportivas */}
                              {(w?.modality === 'ciclismo' || w?.modality === 'corrida' || w?.modality === 'natacao') && (
                                <Button variant="ghost" size="icon-sm" onClick={(e: any) => { e?.stopPropagation?.(); if (w?.modality === 'corrida') setGarminW(w); else fitDownload(w, 'zona'); }} title="Garmin Connect (.FIT)">
                                  <Activity className="h-4 w-4" style={{ color: '#007CC3' }} />
                                </Button>
                              )}
                              {/* MyWhoosh / Zwift / Rouvy (.ZWO) — apenas ciclismo */}
                              {w?.modality === 'ciclismo' && (
                                <>
                                  <Button variant="ghost" size="icon-sm" onClick={(e: any) => { e?.stopPropagation?.(); importMyWhoosh(w); }} title="MyWhoosh (.ZWO)">
                                    <Waves className="h-4 w-4" style={{ color: '#06B6D4' }} />
                                  </Button>
                                  <Button variant="ghost" size="icon-sm" onClick={(e: any) => { e?.stopPropagation?.(); importZwift(w); }} title="Zwift (.ZWO)">
                                    <Bike className="h-4 w-4" style={{ color: '#F97316' }} />
                                  </Button>
                                  <Button variant="ghost" size="icon-sm" onClick={(e: any) => { e?.stopPropagation?.(); importRouvy(w); }} title="Rouvy (.ZWO)">
                                    <ExternalLink className="h-4 w-4" style={{ color: '#A855F7' }} />
                                  </Button>
                                </>
                              )}
                              {/* Baixar em PDF */}
                              <Button variant="ghost" size="icon-sm" onClick={(e: any) => { e?.stopPropagation?.(); exportWorkoutPdf(w); }} title="Baixar em PDF">
                                <Download className="h-4 w-4 text-red-500" />
                              </Button>
                              {/* Baixar arquivo de exportação (.TXT estruturado) */}
                              <Button variant="ghost" size="icon-sm" onClick={(e: any) => { e?.stopPropagation?.(); exportWorkoutTxt(w); }} title="Baixar arquivo de exportação">
                                <Download className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              {/* Excluir treino */}
                              <Button variant="ghost" size="icon-sm" onClick={(e: any) => { e?.stopPropagation?.(); handleDeleteWorkout(w?.id); }} title="Excluir treino">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {isExpanded && (
                            <div id={`workout-details-${w.id}`} className="mt-3 space-y-3 border-t pt-3">
                              <WorkoutStructure value={w?.structure} description={w?.description} />
                              <WorkoutWhatsappLink workout={w} whatsapp={profile?.whatsapp} />
                              {w?.tssEstimate && <p className="text-xs text-muted-foreground mt-2">Carga estimada (TSS): {w.tssEstimate}</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      )}

      <Dialog open={!!garminW} onOpenChange={(o) => { if (!o) setGarminW(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Activity className="h-5 w-5" style={{ color: '#007CC3' }} /> Exportar corrida para o Garmin</DialogTitle>
            <DialogDescription>Como você quer que o treino seja controlado no relógio?</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <button type="button" onClick={() => { fitDownload(garminW, 'zona'); setGarminW(null); }} className="text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors">
              <p className="font-medium text-sm flex items-center gap-2"><Flame className="h-4 w-4 text-red-500" /> Por zona de FC</p>
              <p className="text-xs text-muted-foreground mt-1">Passos por tempo com alerta de frequência cardíaca (zona-alvo). Ideal para treinar pelo esforço.</p>
            </button>
            <button type="button" onClick={() => { fitDownload(garminW, 'km'); setGarminW(null); }} className="text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors">
              <p className="font-medium text-sm flex items-center gap-2"><Timer className="h-4 w-4 text-green-500" /> Por distância (km)</p>
              <p className="text-xs text-muted-foreground mt-1">Passos por distância em metros/km, controle por pace/GPS. Requer seu pace de corrida no perfil (senão usa tempo/FC).</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedWorkout} onOpenChange={(o) => { if (!o) setSelectedWorkout(null); }}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          {selectedWorkout && (() => {
            const w = selectedWorkout;
            const Icon = icons?.[w?.modality] ?? Dumbbell;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /> {w?.title}</DialogTitle>
                  <DialogDescription>
                    <SafeDate date={w?.date} options={{ weekday: 'long', day: 'numeric', month: 'long' }} locale="pt-BR" /> · {workoutPrescription(w)} · {w?.targetZone ?? ''}{w?.phase ? ` · ${phaseLabels?.[w.phase] ?? w.phase}` : ''}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-1">
                  <WorkoutStructure value={w?.structure} description={w?.description} />
                  <div className="mt-3"><WorkoutWhatsappLink workout={w} whatsapp={profile?.whatsapp} /></div>
                  {w?.tssEstimate && <p className="text-xs text-muted-foreground mt-2">Carga estimada (TSS): {w.tssEstimate}</p>}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(w?.modality === 'ciclismo' || w?.modality === 'corrida' || w?.modality === 'natacao') && (
                    <Button variant="outline" size="sm" onClick={() => { if (w?.modality === 'corrida') setGarminW(w); else fitDownload(w, 'zona'); }}><Activity className="mr-1.5 h-4 w-4" style={{ color: '#007CC3' }} /> Garmin</Button>
                  )}
                  {w?.modality === 'ciclismo' && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => importMyWhoosh(w)}><Waves className="mr-1.5 h-4 w-4" style={{ color: '#06B6D4' }} /> MyWhoosh</Button>
                      <Button variant="outline" size="sm" onClick={() => importZwift(w)}><Bike className="mr-1.5 h-4 w-4" style={{ color: '#F97316' }} /> Zwift</Button>
                      <Button variant="outline" size="sm" onClick={() => importRouvy(w)}><ExternalLink className="mr-1.5 h-4 w-4" style={{ color: '#A855F7' }} /> Rouvy</Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" onClick={() => exportWorkoutPdf(w)}><Download className="mr-1.5 h-4 w-4 text-red-500" /> PDF</Button>
                  <Button variant="outline" size="sm" onClick={() => exportWorkoutTxt(w)}><Download className="mr-1.5 h-4 w-4 text-muted-foreground" /> Exportar</Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => { handleDeleteWorkout(w?.id); setSelectedWorkout(null); }}><Trash2 className="mr-1.5 h-4 w-4" /> Excluir</Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
