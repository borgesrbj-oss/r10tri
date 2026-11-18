'use client';
import { useState, useMemo } from 'react';
import { useLocalDate } from '@/hooks/use-browser-state';
import { ChevronRight, ChevronLeft, ClipboardCheck, Activity, Target, Heart, Wrench, Dumbbell, Sparkles, CheckCircle2, FlaskConical, Info, Waves, Bike, Timer, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';
import { formatRaceTime, parseRaceTime } from '@/lib/race-prediction';
import Link from 'next/link';
import { SafeDate } from '@/components/safe-format';
import { TRAINING_GOALS } from '@/lib/training-goals';

const STEPS = [
  { key: 'modalidade', icon: Layers, title: 'Modalidade', subtitle: 'Escolha o foco do seu treino' },
  { key: 'experiencia', icon: ClipboardCheck, title: 'Experiência', subtitle: 'Seu histórico no esporte' },
  { key: 'nivel', icon: Activity, title: 'Nível', subtitle: 'Como você está em cada esporte' },
  { key: 'testes', icon: FlaskConical, title: 'Testes Físicos', subtitle: 'Resultados dos seus testes de limiar' },
  { key: 'metricas', icon: Dumbbell, title: 'Métricas Atuais', subtitle: 'Seus números de performance' },
  { key: 'objetivos', icon: Target, title: 'Objetivos', subtitle: 'O que você quer alcançar' },
  { key: 'saude', icon: Heart, title: 'Saúde & Recuperação', subtitle: 'Lesões, sono e bem-estar' },
  { key: 'logistica', icon: Wrench, title: 'Logística & Equipamento', subtitle: 'Sua rotina e recursos disponíveis' },
];

const MODALITIES = [
  { k: 'triatlo', l: 'Triatlo', icon: Layers, d: 'Natação + Ciclismo + Corrida', color: 'text-primary' },
  { k: 'natacao', l: 'Natação', icon: Waves, d: 'Apenas natação (CSS)', color: 'text-[#3B82F6]' },
  { k: 'ciclismo', l: 'Ciclismo', icon: Bike, d: 'Apenas ciclismo (FTP)', color: 'text-[#F97316]' },
  { k: 'corrida', l: 'Corrida', icon: Timer, d: 'Apenas corrida (Limiar)', color: 'text-[#22C55E]' },
];

const DAYS = [
  { key: 'seg', label: 'Seg' }, { key: 'ter', label: 'Ter' }, { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' }, { key: 'sex', label: 'Sex' }, { key: 'sab', label: 'Sáb' }, { key: 'dom', label: 'Dom' },
];

type OptionButtonProps = { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string };
function OptionButton({ selected, onClick, children, className }: OptionButtonProps) {
  return (
    <button type="button" onClick={onClick}
      className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${selected ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-border hover:border-primary/40 hover:bg-muted/50'} ${className ?? ''}`}
    >{children}</button>
  );
}

function TestProtocolBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-muted/50 border rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Info className="h-4 w-4" />{title}
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function dateField(value: unknown): string {
  if (!(value instanceof Date) && typeof value !== 'string') return '';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : '';
}

export function CoachQuestionnaire({ profile, races = [], generationErrors = [], onComplete }: { profile: any; races?: { name: string; date: string | Date; distance?: string }[]; generationErrors?: string[]; onComplete: (opts?: { startDate?: string; weeks?: number }) => Promise<void> | void }) {
  const confirmedProfile = Boolean(profile?.coachAssessmentDone || profile?.profileCompleted);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [planStartDate, setPlanStartDate] = useState('');
  const [planWeeks, setPlanWeeks] = useState('');
  const todayStr = useLocalDate();
  const [form, setForm] = useState({
    // Step 0 - Modalidade
    modality: confirmedProfile ? profile?.modality ?? '' : '',
    // Step 1 - Experiência
    trainingYears: profile?.trainingYears ?? '',
    level: confirmedProfile ? profile?.level ?? '' : '',
    previousPlanExp: profile?.previousPlanExp ?? '',
    raceHistory: profile?.raceHistory ?? '',
    recentRaceDistanceKm: profile?.recentRaceDistanceKm ?? '',
    recentRaceTime: profile?.recentRaceTimeSeconds ? formatRaceTime(profile.recentRaceTimeSeconds) : '',
    recentRaceDate: dateField(profile?.recentRaceDate),
    // Step 2 - Nível por modalidade
    canSwim: confirmedProfile ? profile?.canSwim ?? null : null,
    swimLevel: profile?.swimLevel ?? '',
    bikeLevel: profile?.bikeLevel ?? '',
    runLevel: profile?.runLevel ?? '',
    weakestSport: profile?.weakestSport ?? '',
    strongestSport: profile?.strongestSport ?? '',
    // Step 3 - Testes Físicos
    testCSS400: profile?.testCSS400 ?? '',
    testCSS200: profile?.testCSS200 ?? '',
    testFTP20min: profile?.testFTP20min ?? '',
    testFTPHR: profile?.testFTPHR ?? '',
    testRun3km: profile?.testRun3km ?? '',
    testRun30min: profile?.testRun30min ?? '',
    testRunPace: profile?.testRunPace ?? '',
    testRunHR: profile?.testRunHR ?? '',
    // Step 4 - Métricas
    currentWeight: profile?.currentWeight ?? '',
    targetWeight: profile?.targetWeight ?? '',
    ftp: profile?.ftp ?? '',
    vo2max: profile?.vo2max ?? '',
    swimPace: profile?.swimPace ?? '',
    runPace: profile?.runPace ?? '',
    birthDate: dateField(profile?.birthDate),
    maxHeartRate: profile?.maxHeartRate ?? '',
    restingHeartRate: profile?.restingHeartRate ?? '',
    thresholdHeartRate: profile?.thresholdHeartRate ?? '',
    runThresholdPace: profile?.runThresholdPace ?? profile?.testRunPace ?? '',
    swimCssPace: profile?.swimCssPace ?? profile?.testCSSPace ?? '',
    // Step 5 - Objetivos
    goalType: profile?.goalType ?? '',
    trainingGoal:profile?.trainingGoal ?? '',
    goalTime: profile?.goalTime ?? '',
    // Step 6 - Saúde
    injuryHistory: profile?.injuryHistory ?? '',
    currentInjuries: profile?.currentInjuries ?? '',
    medicalConditions: profile?.medicalConditions ?? '',
    sleepHours: profile?.sleepHours ?? '',
    stressLevel: profile?.stressLevel ?? '',
    dietaryNotes: profile?.dietaryNotes ?? '',
    // Step 7 - Logística
    weeklyHours: profile?.weeklyHours ?? '',
    currentWeeklyVol: profile?.currentWeeklyVol ?? '',
    heightCm: profile?.heightCm ?? '',
    inactivityWeeks: profile?.inactivityWeeks ?? '',
    strengthAvailable: profile?.strengthAvailable ?? false,
    dailyMinutes: (profile?.dailyMinutes ?? {}) as Record<string,number | string>,
    availableDays: Array.isArray(profile?.availableDays) ? profile.availableDays : [],
    workSchedule: profile?.workSchedule ?? '',
    travelFrequency: profile?.travelFrequency ?? '',
    hasPoolAccess: confirmedProfile ? profile?.hasPoolAccess ?? false : false,
    poolSize: profile?.poolSize ?? '',
    hasTrainer: profile?.hasTrainer ?? false,
    hasPowerMeter: profile?.hasPowerMeter ?? false,
    hasHRM: confirmedProfile ? profile?.hasHRM ?? false : false,
    bikeType: profile?.bikeType ?? '',
    limitations: profile?.limitations ?? '',
  });

  const set = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));
  const toggleDay = (d: string) => set('availableDays', form.availableDays.includes(d) ? form.availableDays.filter((x: string) => x !== d) : [...form.availableDays, d]);

  // Flags de modalidade — definem quais esportes aparecem
  const showSwim = form.modality === 'triatlo' || form.modality === 'natacao';
  const showBike = form.modality === 'triatlo' || form.modality === 'ciclismo';
  const showRun = form.modality === 'triatlo' || form.modality === 'corrida';
  const isTri = form.modality === 'triatlo';

  // Calcular CSS automaticamente
  const cssCalc = useMemo(() => {
    if (!form.testCSS400 || !form.testCSS200) return null;
    const s400 = parseRaceTime(form.testCSS400);
    const s200 = parseRaceTime(form.testCSS200);
    if (s400 === null || s200 === null || s400 <= s200) return null;
    return formatRaceTime((s400 - s200) / 2);
  }, [form.testCSS400, form.testCSS200]);

  // Calcular FTP estimado
  const ftpCalc = useMemo(() => {
    if (!form.testFTP20min) return null;
    return Math.round(Number(form.testFTP20min) * 0.95);
  }, [form.testFTP20min]);

  function stepErrors(key: string): string[] {
    const messages: string[] = [];
    if (key === 'modalidade' && !form.modality) messages.push('Escolha a modalidade que deseja treinar.');
    if (key === 'experiencia') {
      if (!form.level) messages.push('Escolha seu nível de experiência; o app não presume um nível inicial.');
      const hasRace = [form.recentRaceDistanceKm, form.recentRaceTime, form.recentRaceDate].some(value => value !== '');
      if (hasRace && (!(Number(form.recentRaceDistanceKm) > 0) || !parseRaceTime(form.recentRaceTime) || !form.recentRaceDate)) messages.push('Para registrar uma prova de corrida, informe distância, tempo válido e data.');
      if (form.recentRaceDate && todayStr && form.recentRaceDate > todayStr) messages.push('A prova de referência deve estar concluída, com data até hoje.');
    }
    if (key === 'nivel' && showSwim && form.canSwim === null) messages.push('Informe se você sabe nadar antes de continuar.');
    if (key === 'testes' && ((form.testCSS400 || form.testCSS200) && !cssCalc)) messages.push('Confira os tempos CSS: use m:ss, com o tempo de 400 m maior que o de 200 m.');
    if (key === 'metricas') {
      if (!form.birthDate || !Number.isFinite(new Date(`${form.birthDate}T00:00:00Z`).getTime()) || (todayStr && form.birthDate >= todayStr)) messages.push('Informe uma data de nascimento válida para a triagem.');
      for (const [label, value] of [['Limiar de corrida', form.runThresholdPace], ['CSS de natação', form.swimCssPace]] as const) if (value && !parseRaceTime(String(value))) messages.push(`${label}: use o formato m:ss com segundos de 00 a 59.`);
      if (form.maxHeartRate && form.restingHeartRate && Number(form.restingHeartRate) >= Number(form.maxHeartRate)) messages.push('A FC de repouso deve ser menor que a FC máxima informada.');
      if (form.thresholdHeartRate && form.maxHeartRate && Number(form.thresholdHeartRate) >= Number(form.maxHeartRate)) messages.push('A FC de limiar deve ser menor que a FC máxima informada.');
    }
    if (key === 'logistica') {
      if (!form.availableDays.length) messages.push('Selecione pelo menos um dia disponível para treinar.');
      if (!Number.isFinite(Number(form.weeklyHours)) || Number(form.weeklyHours) <= 0) messages.push('Informe suas horas efetivamente disponíveis por semana.');
      if (form.currentWeeklyVol === '' || !Number.isFinite(Number(form.currentWeeklyVol)) || Number(form.currentWeeklyVol) < 0) messages.push('Informe o volume semanal atual; digite 0 apenas se ainda não está treinando.');
    }
    return messages;
  }

  const handleSaveAndGenerate = async () => {
    const invalid = STEPS.map((entry, index) => ({ index, messages: stepErrors(entry.key) })).filter(entry => entry.messages.length);
    if (invalid.length) { setErrors(invalid.flatMap(entry => entry.messages)); setStep(invalid[0].index); return; }
    setErrors([]);
    setSaving(true);
    try {
      const payload = {
        ...Object.fromEntries(Object.entries(form).filter(([key]) => key !== 'recentRaceTime').map(([key, value]) => [key, value === '' ? null : value])),
        birthDate: form.birthDate || null,
        dailyMinutes:Object.fromEntries(Object.entries(form.dailyMinutes).filter(([,value])=>value!=='' && value!=null).map(([day,value])=>[day,Number(value)])),
        recentRaceDate: form.recentRaceDate || null,
        canSwim: form.canSwim === null ? undefined : form.canSwim,
        recentRaceTimeSeconds: form.recentRaceTime ? parseRaceTime(form.recentRaceTime) : null,
        testCSSPace: cssCalc || null,
        testFTPEstimated: ftpCalc || null,
        ftp: form.ftp !== '' ? Number(form.ftp) : ftpCalc,
        swimPace: form.swimPace || cssCalc || null,
        swimCssPace: form.swimCssPace || cssCalc || null,
        runThresholdPace: form.runThresholdPace || form.testRunPace || null,
        testsCompleted: !!(form.testCSS400 || form.testFTP20min || form.testRun3km || form.testRun30min),
      };
      const res = await fetch('/api/profile/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const details = Array.isArray(data?.details) ? data.details.map((detail: unknown) => typeof detail === 'string' ? detail : detail && typeof detail === 'object' && 'message' in detail && typeof detail.message === 'string' ? detail.message : '').filter(Boolean) : [];
        const message = data?.error || 'Não foi possível salvar a avaliação.';
        setErrors([message, ...details]); toast.error(message); return;
      }
      toast.success('Avaliação salva! Gerando plano personalizado...');
      await onComplete({ startDate: planStartDate || undefined, weeks: planWeeks ? Number(planWeeks) : undefined });
    } catch { setErrors(['Não foi possível conectar ao servidor. Confira a conexão antes de tentar novamente.']); toast.error('Erro ao salvar avaliação'); }
    finally { setSaving(false); }
  };

  const current = STEPS[step];
  const StepIcon = current.icon;
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;
  const modLabel = MODALITIES.find(m => m.k === form.modality)?.l ?? 'Triatlo';

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="font-display text-2xl md:text-3xl tracking-tight font-bold flex items-center justify-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" /> Avaliação do Coach
          </h1>
          <p className="text-muted-foreground mt-1">Responda como se estivesse conversando com seu treinador — quanto mais detalhe, melhor o plano.</p>
        </div>
      </FadeIn>

      {/* Progress bar */}
      <div className="relative">
        <div className="flex justify-between mb-2">
          {STEPS.map((s, i) => {
            const SIcon = s.icon;
            return (
              <button key={s.key} type="button" aria-label={`Etapa ${i + 1}: ${s.title}`} aria-current={i===step?'step':undefined} onClick={() => setStep(i)} className={`flex flex-col items-center gap-1 transition-colors ${i <= step ? 'text-primary' : 'text-muted-foreground/40'}`}>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  i < step ? 'bg-primary text-primary-foreground border-primary' : i === step ? 'border-primary text-primary bg-primary/10' : 'border-muted-foreground/20'
                }`}>
                  {i < step ? <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" /> : <SIcon className="h-4 w-4 md:h-5 md:w-5" />}
                </div>
                <span className="text-[10px] md:text-xs font-medium hidden sm:block">{s.title}</span>
              </button>
            );
          })}
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <FadeIn key={step}>
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><StepIcon className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-lg">{current.title}</p>
                <p className="text-sm font-normal text-muted-foreground">{current.subtitle}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* ===== STEP: Modalidade ===== */}
            {current.key === 'modalidade' && (
              <>
                <p className="text-sm text-muted-foreground">Selecione o foco do seu treino. No <strong>Triatlo</strong>, avaliamos natação, ciclismo e corrida juntos. Nas modalidades individuais, mostramos apenas os testes e níveis daquele esporte.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {MODALITIES.map(m => {
                    const MIcon = m.icon;
                    const selected = form.modality === m.k;
                    return (
                      <button key={m.k} type="button" onClick={() => { set('modality', m.k); set('trainingGoal',''); }}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${selected ? 'border-primary bg-primary/10 shadow-sm' : 'border-border hover:border-primary/40 hover:bg-muted/50'}`}>
                        <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0`}>
                          <MIcon className={`h-6 w-6 ${m.color}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold flex items-center gap-2">{m.l}{selected && <CheckCircle2 className="h-4 w-4 text-primary" />}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{m.d}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ===== STEP: Experiência ===== */}
            {current.key === 'experiencia' && (
              <>
                <div className="space-y-2">
                  <Label className="text-base">Há quantos anos você pratica {isTri ? 'triatlo' : modLabel.toLowerCase()} (ou esportes de endurance)?</Label>
                  <Input type="number" min={0} value={form.trainingYears} onChange={e => set('trainingYears', e.target.value)} placeholder="Ex.: 3" />
                  <p className="text-xs text-muted-foreground">Considere também corrida/ciclismo/natação isolados</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Como você classifica seu nível geral?</Label>
                  <div className="flex flex-wrap gap-2">
                    {[{ k: 'iniciante', l: '🟢 Iniciante', d: 'Primeiros passos, poucas provas' }, { k: 'intermediario', l: '🟡 Intermediário', d: 'Já completou provas, treina regular' }, { k: 'avancado', l: '🔴 Avançado', d: 'Treina consistente, busca performance' }].map(o => (
                      <OptionButton key={o.k} selected={form.level === o.k} onClick={() => set('level', o.k)} className="flex-1 min-w-[140px] text-left">
                        <div className="font-semibold">{o.l}</div>
                        <div className="text-xs opacity-70 mt-0.5">{o.d}</div>
                      </OptionButton>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Você já seguiu algum plano de treino estruturado antes?</Label>
                  <div className="flex flex-wrap gap-2">
                    {[{ k: 'nunca', l: 'Nunca' }, { k: 'basico', l: 'Sim, básico/genérico' }, { k: 'estruturado', l: 'Sim, com coach/periodização' }].map(o => (
                      <OptionButton key={o.k} selected={form.previousPlanExp === o.k} onClick={() => set('previousPlanExp', o.k)}>{o.l}</OptionButton>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Histórico de provas (resultados recentes)</Label>
                  <Textarea value={form.raceHistory} onChange={e => set('raceHistory', e.target.value)} placeholder={"Ex.: Ironman 70.3 Floripa 2024 - 6h30min\nSprint Santos 2023 - 1h25\nMeia Maratona SP 2024 - 1h55"} rows={4} />
                  <p className="text-xs text-muted-foreground">Inclua distância, tempo e data — isso ajuda muito a calibrar os treinos</p>
                </div>
                <fieldset className="space-y-3 rounded-lg border p-4">
                  <legend className="px-1 text-sm font-semibold">Resultado recente de CORRIDA — opcional</legend>
                  <p className="text-xs text-muted-foreground">Informe uma prova de corrida independente já concluída. Não use o tempo total de triatlo. Esses dados alimentam a estimativa matemática de prova; deixar em branco não cria resultados presumidos.</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1"><Label htmlFor="recent-race-distance">Distância (km)</Label><Input id="recent-race-distance" type="number" step="0.001" min="3" max="42.195" value={form.recentRaceDistanceKm} onChange={event => set('recentRaceDistanceKm', event.target.value)} placeholder="Ex.: 5" /></div>
                    <div className="space-y-1"><Label htmlFor="recent-race-time">Tempo (m:ss ou h:mm:ss)</Label><Input id="recent-race-time" value={form.recentRaceTime} onChange={event => set('recentRaceTime', event.target.value)} placeholder="Ex.: 24:30" /></div>
                    <div className="space-y-1"><Label htmlFor="recent-race-date">Data da prova</Label><Input id="recent-race-date" type="date" max={todayStr || undefined} value={form.recentRaceDate} onChange={event => set('recentRaceDate', event.target.value)} /></div>
                  </div>
                </fieldset>
              </>
            )}

            {/* ===== STEP: Nível por Modalidade ===== */}
            {current.key === 'nivel' && (
              <>
                <p className="text-sm text-muted-foreground">{isTri ? 'Um bom coach avalia cada modalidade separadamente. Seu ponto fraco recebe mais atenção na planilha.' : `Avalie seu nível atual em ${modLabel.toLowerCase()}.`}</p>

                {showSwim && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-base">🏊 Você sabe nadar?</Label>
                      <div className="flex flex-wrap gap-2">
                        <OptionButton selected={form.canSwim === true} onClick={() => set('canSwim', true)}>Sim, sei nadar</OptionButton>
                        <OptionButton selected={form.canSwim === false} onClick={() => { set('canSwim', false); set('swimLevel', 'nenhuma'); }}>Não sei / muito básico</OptionButton>
                      </div>
                      {form.canSwim === false && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-300">
                          Antes de executar treinos na água, procure orientação de um professor. O plano não substitui a avaliação presencial das suas habilidades aquáticas.
                        </div>
                      )}
                    </div>
                    {form.canSwim && (
                      <div className="space-y-2">
                        <Label className="text-base">🏊 Nível de Natação</Label>
                        <div className="flex flex-wrap gap-2">
                          {[{ k: 'basico', l: 'Nado mas sem técnica' }, { k: 'intermediario', l: 'Boa técnica, preciso de volume' }, { k: 'avancado', l: 'Nado bem, foco em velocidade' }].map(o => (
                            <OptionButton key={o.k} selected={form.swimLevel === o.k} onClick={() => set('swimLevel', o.k)}>{o.l}</OptionButton>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {showBike && (
                  <div className="space-y-2">
                    <Label className="text-base">🚴 Ciclismo</Label>
                    <div className="flex flex-wrap gap-2">
                      {[{ k: 'iniciante', l: 'Pedalo pouco / recreativo' }, { k: 'intermediario', l: 'Pedalo regular, uso GPS' }, { k: 'avancado', l: 'Treino com potência/estruturado' }].map(o => (
                        <OptionButton key={o.k} selected={form.bikeLevel === o.k} onClick={() => set('bikeLevel', o.k)}>{o.l}</OptionButton>
                      ))}
                    </div>
                  </div>
                )}

                {showRun && (
                  <div className="space-y-2">
                    <Label className="text-base">🏃 Corrida</Label>
                    <div className="flex flex-wrap gap-2">
                      {[{ k: 'iniciante', l: 'Começando a correr' }, { k: 'intermediario', l: 'Corro 3x/semana, já fiz provas' }, { k: 'avancado', l: 'Treino intervalado, pace controlado' }].map(o => (
                        <OptionButton key={o.k} selected={form.runLevel === o.k} onClick={() => set('runLevel', o.k)}>{o.l}</OptionButton>
                      ))}
                    </div>
                  </div>
                )}

                {isTri && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-base">Qual é sua modalidade mais FRACA?</Label>
                      <div className="flex flex-wrap gap-2">
                        {[{ k: 'natacao', l: '🏊 Natação' }, { k: 'ciclismo', l: '🚴 Ciclismo' }, { k: 'corrida', l: '🏃 Corrida' }].map(o => (
                          <OptionButton key={o.k} selected={form.weakestSport === o.k} onClick={() => set('weakestSport', o.k)}>{o.l}</OptionButton>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base">Qual é sua modalidade mais FORTE?</Label>
                      <div className="flex flex-wrap gap-2">
                        {[{ k: 'natacao', l: '🏊 Natação' }, { k: 'ciclismo', l: '🚴 Ciclismo' }, { k: 'corrida', l: '🏃 Corrida' }].map(o => (
                          <OptionButton key={o.k} selected={form.strongestSport === o.k} onClick={() => set('strongestSport', o.k)}>{o.l}</OptionButton>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ===== STEP: Testes Físicos ===== */}
            {current.key === 'testes' && (
              <>
                <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-4 mb-2">
                  <p className="text-sm font-medium">Registre apenas resultados de testes que você já realizou com segurança e orientação. Se não tem uma referência, deixe em branco: a prescrição usará esforço percebido (RPE) e avisos, sem inventar FC, pace ou FTP.</p>
                </div>

                {/* CSS - Natação */}
                {showSwim && form.canSwim && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">🏊 Teste de CSS (Critical Swim Speed)</Label>
                    <TestProtocolBox title="Protocolo do Teste">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Aqueça 300m (100 crawl + 100 costas + 100 perna)</li>
                        <li>Nade <strong>400m crawl</strong> o mais rápido possível, anote o tempo</li>
                        <li>Descanse 5-10 minutos nadando solto</li>
                        <li>Nade <strong>200m crawl</strong> o mais rápido possível, anote o tempo</li>
                      </ol>
                      <p className="mt-2 font-medium">CSS = (Tempo 400m − Tempo 200m) ÷ 2 = seu pace por 100m no limiar</p>
                    </TestProtocolBox>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Tempo nos 400m (mm:ss)</Label>
                        <Input value={form.testCSS400} onChange={e => set('testCSS400', e.target.value)} placeholder="Ex.: 7:20" />
                      </div>
                      <div className="space-y-1">
                        <Label>Tempo nos 200m (mm:ss)</Label>
                        <Input value={form.testCSS200} onChange={e => set('testCSS200', e.target.value)} placeholder="Ex.: 3:30" />
                      </div>
                    </div>
                    {cssCalc && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                        <p className="text-sm font-semibold text-green-400">Seu CSS calculado: {cssCalc} por 100m — referência de limiar; cada bloco terá sua intensidade própria.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* FTP - Ciclismo */}
                {showBike && (
                  <div className={`space-y-3 ${showSwim && form.canSwim ? 'border-t pt-4' : ''}`}>
                    <Label className="text-base font-semibold">🚴 Teste de FTP (Functional Threshold Power)</Label>
                    <TestProtocolBox title="Protocolo do Teste de 20 minutos">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Aqueça 15min progressivo (Z1→Z2), inclua 3x1min em Z3</li>
                        <li>Pedale <strong>20 minutos</strong> no maior esforço sustentável (não saia forte demais!)</li>
                        <li>Registre a <strong>potência média</strong> e <strong>FC média</strong></li>
                        <li>Desaqueça 10min em Z1</li>
                      </ol>
                      <p className="mt-2 font-medium">FTP estimado = Potência média × 0,95</p>
                      <p className="text-xs">Registre somente um teste que já realizou com orientação. Se não tem medidor de potência, a FC pode ser informada separadamente, mas não será convertida automaticamente em FTP.</p>
                    </TestProtocolBox>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Potência média 20min (watts)</Label>
                        <Input type="number" value={form.testFTP20min} onChange={e => set('testFTP20min', e.target.value)} placeholder="Ex.: 210" />
                      </div>
                      <div className="space-y-1">
                        <Label>FC média no teste (bpm)</Label>
                        <Input type="number" value={form.testFTPHR} onChange={e => set('testFTPHR', e.target.value)} placeholder="Ex.: 165" />
                      </div>
                    </div>
                    {ftpCalc && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                        <p className="text-sm font-semibold text-green-400">✅ Seu FTP estimado: {ftpCalc}W — base para calcular todas as zonas de potência no bike</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Corrida */}
                {showRun && (
                  <div className={`space-y-3 ${(showSwim && form.canSwim) || showBike ? 'border-t pt-4' : ''}`}>
                    <Label className="text-base font-semibold">🏃 Teste de Limiar de Corrida</Label>
                    <TestProtocolBox title="Escolha um dos protocolos">
                      <div className="space-y-2">
                        <p><strong>Opção A — Teste de 3km:</strong> registre o tempo de um teste de 3 km que já realizou com orientação. O resultado não é automaticamente sua FC ou seu pace de limiar; confira a referência com seu treinador.</p>
                        <p><strong>Opção B — Teste de 30min:</strong> Aqueça 10-15min. Corra 30min no maior ritmo sustentável. O pace médio dos últimos 20min é seu pace de limiar.</p>
                      </div>
                      <p className="text-xs mt-2">Faça em pista ou percurso plano. Registre pace, FC média e distância total.</p>
                    </TestProtocolBox>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Tempo nos 3km (mm:ss)</Label>
                        <Input value={form.testRun3km} onChange={e => set('testRun3km', e.target.value)} placeholder="Ex.: 14:30" />
                      </div>
                      <div className="space-y-1">
                        <Label>FC média no teste (bpm)</Label>
                        <Input type="number" value={form.testRunHR} onChange={e => set('testRunHR', e.target.value)} placeholder="Ex.: 172" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>OU distância em 30min (km)</Label>
                        <Input type="number" step="0.1" value={form.testRun30min} onChange={e => set('testRun30min', e.target.value)} placeholder="Ex.: 5.8" />
                      </div>
                      <div className="space-y-1">
                        <Label>Pace médio de limiar (min/km)</Label>
                        <Input value={form.testRunPace} onChange={e => set('testRunPace', e.target.value)} placeholder="Ex.: 5:10" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ===== STEP: Métricas ===== */}
            {current.key === 'metricas' && (
              <>
                <p className="text-sm text-muted-foreground">Informe sua data de nascimento. As demais referências medidas são opcionais: deixe em branco o que não souber, sem estimar números.</p>
                <div className="space-y-2"><Label htmlFor="assessment-birth-date">Data de nascimento</Label><Input id="assessment-birth-date" type="date" max={todayStr || undefined} value={form.birthDate} onChange={event => set('birthDate', event.target.value)} /><p className="text-xs text-muted-foreground">Usada na triagem; o app não estima sua FC máxima a partir da idade.</p></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Peso atual (kg)</Label>
                    <Input type="number" step="0.1" value={form.currentWeight} onChange={e => set('currentWeight', e.target.value)} placeholder="75.0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Peso meta (kg) <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                    <Input type="number" step="0.1" value={form.targetWeight} onChange={e => set('targetWeight', e.target.value)} placeholder="70.0" />
                  </div>
                </div>
                <fieldset className="space-y-3 rounded-lg border p-4">
                  <legend className="px-1 text-sm font-semibold">Frequência cardíaca medida — opcional</legend>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1"><Label htmlFor="max-heart-rate">FC máxima (bpm)</Label><Input id="max-heart-rate" type="number" min="30" max="250" value={form.maxHeartRate} onChange={event => set('maxHeartRate', event.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="resting-heart-rate">FC de repouso (bpm)</Label><Input id="resting-heart-rate" type="number" min="25" max="150" value={form.restingHeartRate} onChange={event => set('restingHeartRate', event.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="threshold-heart-rate">FC de limiar (bpm)</Label><Input id="threshold-heart-rate" type="number" min="30" max="250" value={form.thresholdHeartRate} onChange={event => set('thresholdHeartRate', event.target.value)} /></div>
                  </div>
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                  {showRun && <div className="space-y-2"><Label htmlFor="run-threshold-pace">Pace de limiar confirmado (m:ss/km)</Label><Input id="run-threshold-pace" value={form.runThresholdPace} onChange={event => set('runThresholdPace', event.target.value)} placeholder="Somente se conhecido" /></div>}
                  {showSwim && <div className="space-y-2"><Label htmlFor="swim-css-pace">CSS confirmado (m:ss/100 m)</Label><Input id="swim-css-pace" value={form.swimCssPace} onChange={event => set('swimCssPace', event.target.value)} placeholder={cssCalc || 'Somente se conhecido'} /></div>}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {showBike && (
                    <div className="space-y-2">
                      <Label>FTP (watts) {ftpCalc && <span className="text-green-500">— calculado: {ftpCalc}W</span>}</Label>
                      <Input type="number" value={form.ftp || ftpCalc || ''} onChange={e => set('ftp', e.target.value)} placeholder="200" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>VO2max <span className="text-muted-foreground text-xs">(se souber)</span></Label>
                    <Input type="number" step="0.1" value={form.vo2max} onChange={e => set('vo2max', e.target.value)} placeholder="45" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {showSwim && (
                    <div className="space-y-2">
                      <Label>Pace natação (min/100m) {cssCalc && <span className="text-green-500">— CSS: {cssCalc}</span>}</Label>
                      <Input value={form.swimPace || cssCalc || ''} onChange={e => set('swimPace', e.target.value)} placeholder="2:15" />
                    </div>
                  )}
                  {showRun && (
                    <div className="space-y-2">
                      <Label>Pace corrida (min/km)</Label>
                      <Input value={form.runPace || form.testRunPace || ''} onChange={e => set('runPace', e.target.value)} placeholder="5:30" />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ===== STEP: Objetivos ===== */}
            {current.key === 'objetivos' && (
              <>
                <div className="space-y-2"><Label htmlFor="training-focus">Foco específico da modalidade (opcional)</Label><select id="training-focus" value={form.trainingGoal} onChange={event=>set('trainingGoal',event.target.value)} className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">Preparação geral, sem distância presumida</option>{Object.entries(TRAINING_GOALS[form.modality]??{}).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><p className="text-xs text-muted-foreground">O foco fica salvo e influencia as próximas gerações. Confira também a data e a prioridade das provas.</p></div>
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  {races[0] ? <p>Prova principal cadastrada: <strong>{races[0].name}</strong> — <SafeDate date={races[0].date} options={{ day: 'numeric', month: 'long', year: 'numeric' }} locale="pt-BR" />.</p> : <p>Ainda não há prova principal com data cadastrada. Cadastre o evento para periodizar até a prova; sem evento, escolha um ciclo de treino por semanas.</p>}
                  <Link href="/provas" className="mt-2 inline-block text-primary underline">Cadastrar ou revisar objetivo e data em Provas</Link>
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Qual o seu principal objetivo com o treinamento?</Label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {[
                      { k: 'completar', l: '🏁 Completar a prova', d: 'Chegar ao fim saudável e feliz' },
                      { k: 'melhorar_tempo', l: '⏱️ Melhorar meu tempo', d: 'Superar meu recorde pessoal' },
                      { k: 'competir', l: '🏆 Competir de verdade', d: 'Buscar pódio na minha categoria' },
                      { k: 'top_age_group', l: '🥇 Top Age Group', d: 'Performance de alto nível' },
                    ].map(o => (
                      <OptionButton key={o.k} selected={form.goalType === o.k} onClick={() => set('goalType', o.k)} className="text-left">
                        <div className="font-semibold">{o.l}</div>
                        <div className="text-xs opacity-70 mt-0.5">{o.d}</div>
                      </OptionButton>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Tempo-alvo na próxima prova <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <Input aria-label="Tempo-alvo na próxima prova" value={form.goalTime} onChange={e => set('goalTime', e.target.value)} placeholder="Ex.: 45:00 ou 1:40:00" />
                  <p className="text-xs text-muted-foreground">Para comparação numérica na corrida, use m:ss ou h:mm:ss e registre um resultado recente. No triatlo, não comparamos o tempo total com previsão de corrida isolada.</p>
                </div>
              </>
            )}

            {/* ===== STEP: Saúde ===== */}
            {current.key === 'saude' && (
              <>
                <p className="text-sm text-muted-foreground">Um coach responsável SEMPRE pergunta sobre saúde antes de prescrever treino. Seja honesto aqui.</p>
                <div className="space-y-2">
                  <Label className="text-base">Lesões atuais (que limitam o treino hoje)</Label>
                  <Textarea value={form.currentInjuries} onChange={e => set('currentInjuries', e.target.value)} placeholder="Ex.: tendinite no tendão de Aquiles direito, dor no ombro ao nadar..." rows={2} />
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Histórico de lesões passadas</Label>
                  <Textarea value={form.injuryHistory} onChange={e => set('injuryHistory', e.target.value)} placeholder="Ex.: fratura de estresse no pé em 2022, cirurgia no menisco em 2020..." rows={2} />
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Condições médicas relevantes</Label>
                  <Textarea value={form.medicalConditions} onChange={e => set('medicalConditions', e.target.value)} placeholder="Ex.: asma, hipotireoidismo, diabetes..." rows={2} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horas de sono por noite</Label>
                    <Input type="number" step="0.5" min={3} max={12} value={form.sleepHours} onChange={e => set('sleepHours', e.target.value)} placeholder="7" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nível de estresse no dia a dia</Label>
                    <div className="flex flex-wrap gap-2">
                      {[{ k: 'baixo', l: '😌 Baixo' }, { k: 'moderado', l: '😐 Moderado' }, { k: 'alto', l: '😰 Alto' }].map(o => (
                        <OptionButton key={o.k} selected={form.stressLevel === o.k} onClick={() => set('stressLevel', o.k)}>{o.l}</OptionButton>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Restrições alimentares <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <Input value={form.dietaryNotes} onChange={e => set('dietaryNotes', e.target.value)} placeholder="Ex.: vegetariano, intolerante à lactose, sem glúten..." />
                </div>
              </>
            )}

            {/* ===== STEP: Logística ===== */}
            {current.key === 'logistica' && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="height-cm">Altura em cm (opcional)</Label><Input id="height-cm" type="number" min={80} max={250} value={form.heightCm} onChange={event=>set('heightCm',event.target.value)} placeholder="Pode preencher depois" /></div>
                  <div className="space-y-2"><Label htmlFor="inactivity-weeks">Semanas afastado dos treinos</Label><Input id="inactivity-weeks" type="number" min={0} max={104} value={form.inactivityWeeks} onChange={event=>set('inactivityWeeks',event.target.value)} placeholder="0 se não houve afastamento" /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base">Horas DISPONÍVEIS por semana para treino</Label>
                    <Input type="number" step="0.5" min={0.5} max={40} value={form.weeklyHours} onChange={e => set('weeklyHours', e.target.value)} placeholder="Informe seu tempo disponível" />
                    <p className="text-xs text-muted-foreground">Informe tempo efetivo de treino; não some deslocamentos.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base">Quantas horas você treina HOJE por semana?</Label>
                    <Input type="number" step="0.5" min={0} max={40} value={form.currentWeeklyVol} onChange={e => set('currentWeeklyVol', e.target.value)} placeholder="0 se ainda não está treinando" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Dias disponíveis para treinar</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(d => (
                      <OptionButton key={d.key} selected={form.availableDays.includes(d.key)} onClick={() => toggleDay(d.key)}>{d.label}</OptionButton>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Sua rotina de trabalho</Label>
                  <fieldset className="rounded-xl border p-4 space-y-3"><legend className="px-2 text-sm font-medium">Limite de treino por dia, em minutos</legend><p className="text-xs text-muted-foreground">Inclui todas as modalidades e força. 0 reserva o dia para descanso; vazio mantém o limite operacional por experiência. O limite semanal também será respeitado.</p><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{DAYS.filter(day=>form.availableDays.includes(day.key)).map(day=><div key={day.key}><Label htmlFor={`limit-${day.key}`}>{day.label}</Label><Input id={`limit-${day.key}`} type="number" min={0} max={480} value={form.dailyMinutes[day.key]??''} onChange={event=>set('dailyMinutes',{...form.dailyMinutes,[day.key]:event.target.value})} placeholder="Não informado" /></div>)}</div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.strengthAvailable} onChange={event=>set('strengthAvailable',event.target.checked)} /> Tenho disponibilidade para força e mobilidade</label></fieldset>
                  <div className="flex flex-wrap gap-2">
                    {[{ k: 'flexivel', l: '🏠 Flexível/Remoto' }, { k: 'fixo_comercial', l: '🏢 Horário comercial' }, { k: 'turnos', l: '🔄 Turnos/Escalas' }].map(o => (
                      <OptionButton key={o.k} selected={form.workSchedule === o.k} onClick={() => set('workSchedule', o.k)}>{o.l}</OptionButton>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Viaja a trabalho com frequência?</Label>
                  <div className="flex flex-wrap gap-2">
                    {[{ k: 'raro', l: 'Raramente' }, { k: 'mensal', l: 'Mensalmente' }, { k: 'semanal', l: 'Semanalmente' }].map(o => (
                      <OptionButton key={o.k} selected={form.travelFrequency === o.k} onClick={() => set('travelFrequency', o.k)}>{o.l}</OptionButton>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-4 mt-2">
                  <Label className="text-base mb-3 block">Equipamento e acesso</Label>
                  <p className="mb-3 text-xs text-muted-foreground">Marque apenas o que está disponível e confira os dados existentes. Opções desmarcadas serão consideradas indisponíveis.</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      ...(showSwim ? [{ key: 'hasPoolAccess', label: '🏊 Acesso a piscina', val: form.hasPoolAccess }] : []),
                      ...(showBike ? [{ key: 'hasTrainer', label: '🚴 Rolo/Trainer indoor', val: form.hasTrainer }, { key: 'hasPowerMeter', label: '⚡ Medidor de potência', val: form.hasPowerMeter }] : []),
                      { key: 'hasHRM', label: '❤️ Frequencímetro', val: form.hasHRM },
                    ].map(eq => (
                      <button key={eq.key} type="button" onClick={() => set(eq.key, !eq.val)}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${eq.val ? 'border-primary bg-primary/5' : 'border-border opacity-60'}`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${eq.val ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                          {eq.val && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                        </div>
                        <span className="text-sm font-medium">{eq.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {showSwim && form.hasPoolAccess && (
                  <div className="space-y-2">
                    <Label>Tamanho da piscina</Label>
                    <div className="flex flex-wrap gap-2">
                      {[{ k: '25m', l: '25m' }, { k: '50m', l: '50m' }, { k: 'mar_aberto', l: 'Mar aberto' }].map(o => (
                        <OptionButton key={o.k} selected={form.poolSize === o.k} onClick={() => set('poolSize', o.k)}>{o.l}</OptionButton>
                      ))}
                    </div>
                  </div>
                )}
                {showBike && (
                  <div className="space-y-2">
                    <Label>Tipo de bike principal</Label>
                    <div className="flex flex-wrap gap-2">
                      {[{ k: 'speed', l: 'Speed/Road' }, { k: 'tt', l: 'TT/Contra-relógio' }, { k: 'mtt', l: 'MTB' }, { k: 'gravel', l: 'Gravel' }].map(o => (
                        <OptionButton key={o.k} selected={form.bikeType === o.k} onClick={() => set('bikeType', o.k)}>{o.l}</OptionButton>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Outras limitações ou observações</Label>
                  <Textarea value={form.limitations} onChange={e => set('limitations', e.target.value)} placeholder="Ex.: Só consigo nadar 2x na semana, treino no horário do almoço..." rows={2} />
                </div>
                <div className="border-t pt-4 mt-2 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base">📅 Quando começar o plano?</Label>
                    <Input type="date" value={planStartDate} min={todayStr} onChange={e => setPlanStartDate(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Deixe em branco para começar hoje.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base">Quantas semanas de treino? <span className="text-muted-foreground text-xs">(mínimo 6)</span></Label>
                    <div className="flex flex-wrap gap-2">
                      <OptionButton selected={planWeeks === ''} onClick={() => setPlanWeeks('')}>Automático</OptionButton>
                      {[6, 8, 12, 16, 20, 24].map(n => (
                        <OptionButton key={n} selected={planWeeks === String(n)} onClick={() => setPlanWeeks(String(n))}>{n} semanas</OptionButton>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Em “Automático”, o plano considera a prova prioritária e mais duas semanas de transição, limitado a 52 semanas; sem prova, usa 12 semanas.</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {(errors.length > 0 || generationErrors.length > 0) && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm"><p className="font-semibold">Revise os dados da triagem</p><ul className="mt-2 list-disc space-y-1 pl-4">{[...errors, ...generationErrors].map((message, index) => <li key={index}>{message}</li>)}</ul></div>}

      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
        </Button>
        <span className="text-sm text-muted-foreground">{step + 1} de {STEPS.length}</span>
        {isLast ? (
          <Button onClick={handleSaveAndGenerate} loading={saving} size="lg">
            <Sparkles className="mr-2 h-4 w-4" /> Gerar Plano Personalizado
          </Button>
        ) : (
          <Button onClick={() => { const messages = stepErrors(current.key); setErrors(messages); if (!messages.length) setStep(s => s + 1); }}>
            Próximo <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
