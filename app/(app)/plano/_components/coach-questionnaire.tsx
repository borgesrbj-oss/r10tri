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

export function CoachQuestionnaire({ profile, onComplete }: { profile: any; onComplete: (opts?: { startDate?: string; weeks?: number }) => void }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [planStartDate, setPlanStartDate] = useState('');
  const [planWeeks, setPlanWeeks] = useState('');
  const todayStr = useLocalDate();
  const [form, setForm] = useState({
    // Step 0 - Modalidade
    modality: profile?.modality ?? 'triatlo',
    // Step 1 - Experiência
    trainingYears: profile?.trainingYears ?? '',
    level: profile?.level ?? 'intermediario',
    previousPlanExp: profile?.previousPlanExp ?? '',
    raceHistory: profile?.raceHistory ?? '',
    // Step 2 - Nível por modalidade
    canSwim: profile?.canSwim ?? true,
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
    // Step 5 - Objetivos
    goalType: profile?.goalType ?? '',
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
    availableDays: profile?.availableDays ?? ['seg', 'qua', 'sex'],
    workSchedule: profile?.workSchedule ?? '',
    travelFrequency: profile?.travelFrequency ?? '',
    hasPoolAccess: profile?.hasPoolAccess ?? true,
    poolSize: profile?.poolSize ?? '',
    hasTrainer: profile?.hasTrainer ?? false,
    hasPowerMeter: profile?.hasPowerMeter ?? false,
    hasHRM: profile?.hasHRM ?? true,
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
    const toSec = (t: string) => { const p = t.split(':'); return p.length === 2 ? Number(p[0]) * 60 + Number(p[1]) : NaN; };
    const s400 = toSec(form.testCSS400);
    const s200 = toSec(form.testCSS200);
    if (isNaN(s400) || isNaN(s200) || s400 <= s200) return null;
    const cssSec = (s400 - s200) / 2;
    const m = Math.floor(cssSec / 60);
    const s = Math.round(cssSec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }, [form.testCSS400, form.testCSS200]);

  // Calcular FTP estimado
  const ftpCalc = useMemo(() => {
    if (!form.testFTP20min) return null;
    return Math.round(Number(form.testFTP20min) * 0.95);
  }, [form.testFTP20min]);

  const handleSaveAndGenerate = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        testCSSPace: cssCalc || undefined,
        testFTPEstimated: ftpCalc || undefined,
        ftp: ftpCalc || (form.ftp ? Number(form.ftp) : undefined),
        swimPace: cssCalc || form.swimPace || undefined,
        testsCompleted: !!(form.testCSS400 || form.testFTP20min || form.testRun3km || form.testRun30min),
      };
      const res = await fetch('/api/profile/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { toast.error('Erro ao salvar avaliação'); return; }
      toast.success('Avaliação salva! Gerando plano personalizado...');
      onComplete({ startDate: planStartDate || undefined, weeks: planWeeks ? Number(planWeeks) : undefined });
    } catch { toast.error('Erro ao salvar avaliação'); }
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
              <button key={s.key} onClick={() => setStep(i)} className={`flex flex-col items-center gap-1 transition-colors ${i <= step ? 'text-primary' : 'text-muted-foreground/40'}`}>
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
                      <button key={m.k} type="button" onClick={() => set('modality', m.k)}
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
                      <div className="flex gap-2">
                        <OptionButton selected={form.canSwim === true} onClick={() => set('canSwim', true)}>Sim, sei nadar</OptionButton>
                        <OptionButton selected={form.canSwim === false} onClick={() => { set('canSwim', false); set('swimLevel', 'nenhuma'); }}>Não sei / muito básico</OptionButton>
                      </div>
                      {!form.canSwim && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-300">
                          ⚠️ Sem problema! O plano incluirá aulas de adaptação ao meio aquático antes de treinos de natação propriamente ditos. Recomendamos buscar um professor de natação em paralelo.
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
                      <div className="flex gap-2">
                        {[{ k: 'natacao', l: '🏊 Natação' }, { k: 'ciclismo', l: '🚴 Ciclismo' }, { k: 'corrida', l: '🏃 Corrida' }].map(o => (
                          <OptionButton key={o.k} selected={form.weakestSport === o.k} onClick={() => set('weakestSport', o.k)}>{o.l}</OptionButton>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base">Qual é sua modalidade mais FORTE?</Label>
                      <div className="flex gap-2">
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
                  <p className="text-sm font-medium">🧪 Os melhores treinadores do mundo usam testes de limiar para definir zonas de treino precisas. Faça {isTri ? 'os testes abaixo' : 'o teste abaixo'} e registre seus resultados. Se ainda não fez, pode deixar em branco — estimaremos pelo seu nível.</p>
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
                        <p className="text-sm font-semibold text-green-400">✅ Seu CSS: {cssCalc} por 100m — esse será seu pace de referência Z2/Z3 nos treinos de natação</p>
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
                      <p className="text-xs">Pode ser feito no rolo ou na estrada (plano, sem paradas). Se não tem medidor de potência, informe a FC média.</p>
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
                        <p><strong>Opção A — Teste de 3km:</strong> Aqueça 10-15min. Corra 3km o mais rápido que conseguir manter. O limiar fica em ~90% desse ritmo.</p>
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
                <p className="text-sm text-muted-foreground">Preencha o que souber — se não tiver algum dado, pode deixar em branco. Isso calibra as zonas de treino.</p>
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
                  <Input value={form.goalTime} onChange={e => set('goalTime', e.target.value)} placeholder="Ex.: sub-6h no 70.3, sub-13h no Ironman, sub-1h20 no Sprint" />
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
                    <div className="flex gap-2">
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
                  <div className="space-y-2">
                    <Label className="text-base">Horas DISPONÍVEIS por semana para treino</Label>
                    <Input type="number" step="0.5" min={2} max={30} value={form.weeklyHours} onChange={e => set('weeklyHours', e.target.value)} placeholder="10" />
                    <p className="text-xs text-muted-foreground">Inclua deslocamento até o local de treino</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base">Quantas horas você treina HOJE por semana?</Label>
                    <Input type="number" step="0.5" min={0} max={30} value={form.currentWeeklyVol} onChange={e => set('currentWeeklyVol', e.target.value)} placeholder="6" />
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
                  <div className="flex flex-wrap gap-2">
                    {[{ k: 'flexivel', l: '🏠 Flexível/Remoto' }, { k: 'fixo_comercial', l: '🏢 Horário comercial' }, { k: 'turnos', l: '🔄 Turnos/Escalas' }].map(o => (
                      <OptionButton key={o.k} selected={form.workSchedule === o.k} onClick={() => set('workSchedule', o.k)}>{o.l}</OptionButton>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Viaja a trabalho com frequência?</Label>
                  <div className="flex gap-2">
                    {[{ k: 'raro', l: 'Raramente' }, { k: 'mensal', l: 'Mensalmente' }, { k: 'semanal', l: 'Semanalmente' }].map(o => (
                      <OptionButton key={o.k} selected={form.travelFrequency === o.k} onClick={() => set('travelFrequency', o.k)}>{o.l}</OptionButton>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-4 mt-2">
                  <Label className="text-base mb-3 block">Equipamento e acesso</Label>
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
                    <div className="flex gap-2">
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
                    <p className="text-xs text-muted-foreground">Em “Automático”, o plano vai até a data da sua próxima prova (ou 12 semanas se não houver prova).</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
        </Button>
        <span className="text-sm text-muted-foreground">{step + 1} de {STEPS.length}</span>
        {isLast ? (
          <Button onClick={handleSaveAndGenerate} loading={saving} size="lg">
            <Sparkles className="mr-2 h-4 w-4" /> Gerar Plano Personalizado
          </Button>
        ) : (
          <Button onClick={() => setStep(s => s + 1)}>
            Próximo <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
