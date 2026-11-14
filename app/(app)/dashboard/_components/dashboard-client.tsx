'use client';
import { useState, useEffect } from 'react';
import { Waves, Bike, Timer, Target, TrendingUp, Calendar, Dumbbell, Scale, ArrowRight, Activity, Settings, BookOpen, ClipboardList, Users, MessageSquare, UserCircle, Sliders } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrentTime, useStoredNickname } from '@/hooks/use-browser-state';
import { FadeIn, SlideIn, Stagger, StaggerItem, HoverLift } from '@/components/ui/animate';
import { SafeDate } from '@/components/safe-format';

const DEFAULT_PREFS = { stats: true, provas: true, treinos: true, avisos: true, sobre: true };
const WIDGET_LABELS: { key: keyof typeof DEFAULT_PREFS; label: string }[] = [
  { key: 'stats', label: 'Indicadores (treinos, conclusão, provas, peso)' },
  { key: 'avisos', label: 'Avisos do coach' },
  { key: 'sobre', label: 'Sobre mim' },
  { key: 'provas', label: 'Próximas provas' },
  { key: 'treinos', label: 'Treinos recentes' },
];

const quickActions = [
  { href: '/exercicios', label: 'Mobilidade & Força', desc: 'Exercícios guiados', icon: Activity, color: '#A855F7' },
  { href: '/configurar-treino', label: 'Configurar Treino', desc: 'Dias e modalidades', icon: Settings, color: '#1A8A7D' },
  { href: '/guias', label: 'Guia & Tutoriais', desc: 'Vídeos e passo a passo', icon: BookOpen, color: '#3B82F6' },
  { href: '/plano', label: 'Avaliação Física', desc: 'Questionário por modalidade', icon: ClipboardList, color: '#F97316' },
  { href: '/calendario', label: 'Registrar Treino', desc: 'Calendário semanal', icon: Calendar, color: '#22C55E' },
];

const modalityIcons: Record<string, any> = { natacao: Waves, ciclismo: Bike, corrida: Timer, forca: Dumbbell };
const modalityColors: Record<string, string> = { natacao: 'text-blue-500', ciclismo: 'text-orange-500', corrida: 'text-green-500', forca: 'text-purple-500' };
const distanceLabels: Record<string, string> = { sprint: 'Sprint', olimpico: 'Olímpico', '70.3': 'Half Ironman', ironman: 'Ironman' };

export function DashboardClient({ data }: { data: any }) {
  const { profile, recentWorkouts, totalWorkouts, completedWorkouts, upcomingRaces, userName, isCoach } = data ?? {};
  const completionRate = (totalWorkouts ?? 0) > 0 ? Math.round(((completedWorkouts ?? 0) / (totalWorkouts ?? 1)) * 100) : 0;
  const nickname = useStoredNickname();
  const now = useCurrentTime();
  const [motivation, setMotivation] = useState<string>('');
  useEffect(() => {
    fetch('/api/motivation').then(r => r.json()).then(d => { if (d?.phrase) setMotivation(d.phrase); }).catch(() => {});
  }, []);
  const greetingName = profile?.nickname || nickname || userName || 'Atleta';
  const photoUrl = profile?.photoUrl;
  const router = useRouter();
  const coachMessages = data?.coachMessages ?? [];
  const hasUnreadCoachMessages = coachMessages.some((message: any) => !message.read);
  const [prefs, setPrefs] = useState<any>(() => {
    try { return { ...DEFAULT_PREFS, ...(profile?.dashboardPrefs ? JSON.parse(profile.dashboardPrefs) : {}) }; } catch { return { ...DEFAULT_PREFS }; }
  });
  const [aboutMe, setAboutMe] = useState<string>(profile?.aboutMe ?? '');
  const [showSettings, setShowSettings] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (!isCoach && hasUnreadCoachMessages) {
      fetch('/api/coach-message/list', { method: 'POST' }).catch(() => {});
    }
  }, [isCoach, hasUnreadCoachMessages]);

  const savePrefs = async () => {
    setSavingPrefs(true);
    try {
      const res = await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dashboardPrefs: JSON.stringify(prefs), aboutMe }) });
      if (res.ok) { toast.success('Início personalizado!'); setShowSettings(false); router.refresh(); }
      else toast.error('Erro ao salvar preferências');
    } catch { toast.error('Erro ao salvar preferências'); } finally { setSavingPrefs(false); }
  };

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="hero-gradient rounded-lg p-6 md:p-8 relative">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="absolute top-4 right-4"><Sliders className="h-4 w-4 mr-1.5" /> Personalizar</Button>
          <div className="flex items-center gap-4">
            {photoUrl ? (
              <Image src={photoUrl} alt={greetingName} width={64} height={64} unoptimized className="h-16 w-16 rounded-full object-cover border-2 border-primary/40 shrink-0" />
            ) : null}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Waves className="h-5 w-5" style={{ color: '#3B82F6' }} />
                <Bike className="h-5 w-5" style={{ color: '#F97316' }} />
                <Timer className="h-5 w-5" style={{ color: '#22C55E' }} />
              </div>
              <h1 className="font-display text-3xl md:text-4xl tracking-tight font-bold">Olá, <span className="text-primary">{greetingName}</span>!</h1>
              <p className="text-muted-foreground mt-1">Acompanhe seus treinos e sua evolução</p>
            </div>
          </div>
          {motivation ? (
            <div className="mt-4 flex items-start gap-2 rounded-md bg-primary/10 border border-primary/20 px-4 py-3">
              <TrendingUp className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm italic text-foreground/90">{motivation}</p>
            </div>
          ) : null}
        </div>
      </FadeIn>

      {prefs.sobre && profile?.aboutMe && (
        <FadeIn>
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><UserCircle className="h-5 w-5 text-primary" /> Sobre mim</CardTitle></CardHeader>
            <CardContent><p className="text-sm whitespace-pre-wrap leading-relaxed">{profile.aboutMe}</p></CardContent>
          </Card>
        </FadeIn>
      )}

      {prefs.avisos && coachMessages.length > 0 && (
        <FadeIn>
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-5 w-5 text-amber-500" /> Avisos do Coach</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-72 overflow-y-auto">
              {coachMessages.map((m: any) => (
                <div key={m.id} className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-1"><SafeDate date={m.createdAt} options={{ dateStyle: 'short', timeStyle: 'short' }} locale="pt-BR" /></p>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {prefs.stats && (
      <Stagger staggerDelay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StaggerItem><HoverLift><Card><CardContent className="p-4 text-center">
            <Dumbbell className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono">{totalWorkouts ?? 0}</p>
            <p className="text-xs text-muted-foreground">Treinos Totais</p>
          </CardContent></Card></HoverLift></StaggerItem>
          <StaggerItem><HoverLift><Card><CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">Taxa Conclusão</p>
          </CardContent></Card></HoverLift></StaggerItem>
          <StaggerItem><HoverLift><Card><CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono">{upcomingRaces?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Provas Próximas</p>
          </CardContent></Card></HoverLift></StaggerItem>
          <StaggerItem><HoverLift><Card><CardContent className="p-4 text-center">
            <Scale className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono">{profile?.currentWeight ? `${profile.currentWeight}kg` : '—'}</p>
            <p className="text-xs text-muted-foreground">Peso Atual</p>
          </CardContent></Card></HoverLift></StaggerItem>
        </div>
      </Stagger>
      )}

      <FadeIn delay={0.15}>
        <div>
          <h2 className="font-display text-lg font-semibold mb-3">Ações Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickActions.map((a: any) => {
              const Icon = a.icon;
              return (
                <Link key={a.href} href={a.href}>
                  <HoverLift>
                    <Card className="h-full">
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="rounded-lg p-2 shrink-0" style={{ backgroundColor: `${a.color}22` }}>
                          <Icon className="h-5 w-5" style={{ color: a.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm leading-tight">{a.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </HoverLift>
                </Link>
              );
            })}
            {isCoach && (
              <Link href="/atletas">
                <HoverLift>
                  <Card className="h-full border-primary/40 bg-primary/5">
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="rounded-lg p-2 shrink-0 bg-primary/15">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-tight">Gerenciar Atletas</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Painel do treinador</p>
                      </div>
                    </CardContent>
                  </Card>
                </HoverLift>
              </Link>
            )}
          </div>
        </div>
      </FadeIn>

      {!profile && (
        <SlideIn from="bottom">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div><h3 className="font-display font-semibold text-lg">Complete seu perfil de atleta</h3><p className="text-sm text-muted-foreground">Para gerar planos personalizados, precisamos conhecer você</p></div>
              <Link href="/perfil"><Button>Ir para o Perfil <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            </CardContent>
          </Card>
        </SlideIn>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {prefs.provas && (
        <FadeIn delay={0.2}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Próximas Provas</CardTitle></CardHeader>
            <CardContent>
              {(upcomingRaces?.length ?? 0) === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>Nenhuma prova cadastrada</p>
                  <Link href="/provas"><Button variant="outline" size="sm" className="mt-2">Cadastrar Prova</Button></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingRaces?.slice(0, 3)?.map((race: any) => {
                    const daysLeft = now === null ? null : Math.ceil((new Date(race?.date).getTime() - now) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={race?.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{race?.name}</p>
                          <p className="text-sm text-muted-foreground"><SafeDate date={race?.date} options={{ dateStyle: 'medium' }} locale="pt-BR" /> · {distanceLabels?.[race?.distance] ?? race?.distance}</p>
                        </div>
                        <Badge variant={daysLeft !== null && daysLeft <= 30 ? 'destructive' : 'secondary'}>{daysLeft ?? '—'}d</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
        )}

        {prefs.treinos && (
        <FadeIn delay={0.3}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Treinos Recentes</CardTitle></CardHeader>
            <CardContent>
              {(recentWorkouts?.length ?? 0) === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>Nenhum treino ainda</p>
                  <Link href="/plano"><Button variant="outline" size="sm" className="mt-2">Gerar Plano</Button></Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentWorkouts?.slice(0, 5)?.map((w: any) => {
                    const Icon = modalityIcons?.[w?.modality] ?? Dumbbell;
                    return (
                      <div key={w?.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Icon className={`h-5 w-5 ${modalityColors?.[w?.modality] ?? 'text-muted-foreground'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{w?.title}</p>
                          <p className="text-xs text-muted-foreground">{w?.duration}min · {w?.targetZone ?? ''}</p>
                        </div>
                        {w?.completed && <Badge variant="secondary" className="text-xs">✓</Badge>}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
        )}
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sliders className="h-5 w-5 text-primary" /> Personalizar início</DialogTitle>
            <DialogDescription>Escolha o que aparece na sua tela inicial e deixe uma nota sobre você.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Seções visíveis</p>
              {WIDGET_LABELS.map((w) => (
                <div key={w.key} className="flex items-center justify-between gap-3 rounded-lg border p-2.5">
                  <span className="text-sm">{w.label}</span>
                  <Switch checked={!!prefs[w.key]} onCheckedChange={(v: boolean) => setPrefs((p: any) => ({ ...p, [w.key]: v }))} />
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aboutMe">Sobre mim</Label>
              <Textarea id="aboutMe" rows={4} value={aboutMe} onChange={(e: any) => setAboutMe(e.target.value)} placeholder="Escreva o que quiser destacar: seus objetivos, histórico, metas da temporada..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>Cancelar</Button>
            <Button onClick={savePrefs} loading={savingPrefs}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
