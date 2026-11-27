'use client';
import {PlanningPreferencesForm,type PlanningPreferencesHandle} from '@/components/planning-preferences-form';

import { useRef,useState } from 'react';
import { Settings, Clock, Save, Waves, Bike, Timer, Dumbbell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const DAYS = [
  { key: 'seg', label: 'Segunda' },
  { key: 'ter', label: 'Terça' },
  { key: 'qua', label: 'Quarta' },
  { key: 'qui', label: 'Quinta' },
  { key: 'sex', label: 'Sexta' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
];

const MODALITIES = [
  { key: 'natacao', label: 'Natação', icon: Waves, color: '#3B82F6' },
  { key: 'ciclismo', label: 'Ciclismo', icon: Bike, color: '#F97316' },
  { key: 'corrida', label: 'Corrida', icon: Timer, color: '#22C55E' },
  { key: 'forca', label: 'Força', icon: Dumbbell, color: '#1A8A7D' },
];

function parseSchedule(raw: string | null | undefined): Record<string, string[]> {
  if (!raw) return {};
  try {
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    return Object.fromEntries(DAYS.flatMap(day => {
      const values = (saved as Record<string,unknown>)[day.key];
      if (!Array.isArray(values)) return [];
      const known = [...new Set(values.filter(value => MODALITIES.some(modality => modality.key === value)))];
      return known.length ? [[day.key, known]] : [];
    }));
  } catch { return {}; }
}

function parseEnv(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {};
  try { return JSON.parse(raw) ?? {}; } catch { return {}; }
}

export function ConfigurarTreinoClient({ profile }: { profile: any }) {
  const [schedule, setSchedule] = useState<Record<string, string[]>>(parseSchedule(profile?.daySchedule));
  const [availableDays, setAvailableDays] = useState<string[]>(profile?.availableDays ?? []);
  const [bikeEnv, setBikeEnv] = useState<Record<string, string>>(parseEnv(profile?.bikeEnvByDay));
  const [runEnv, setRunEnv] = useState<Record<string, string>>(parseEnv(profile?.runEnvByDay));
  const [weeklyHours, setWeeklyHours] = useState<string>(profile?.weeklyHours != null ? String(profile.weeklyHours) : '');
  const preferencesRef=useRef<PlanningPreferencesHandle>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const toggleModality = (day: string, mod: string) => {
    setSchedule((prev) => {
      const current = prev[day] ?? [];
      const next = current.includes(mod) ? current.filter((m) => m !== mod) : [...current, mod];
      const updated = { ...prev, [day]: next };
      if (next.length === 0) delete updated[day];
      return updated;
    });
  };

  const fixedDays = availableDays.filter(day => (schedule[day] ?? []).length > 0);
  const scheduleCoversWeek = fixedDays.length > 0 && fixedDays.length === availableDays.length;
  const hasSwimDay = fixedDays.some(day => schedule[day].includes('natacao'));

  const handleSave = async () => {
    setSaving(true);
    try {
      const preferencesPatch=preferencesRef.current?.getPatch();
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daySchedule: JSON.stringify(schedule),
          bikeEnvByDay: JSON.stringify(bikeEnv),
          runEnvByDay: JSON.stringify(runEnv),
          ...preferencesPatch,
          weeklyHours: weeklyHours ? Number(weeklyHours) : null,
        }),
      });
      if (res.ok) { toast.success('Configuração de treino salva!'); router.refresh(); }
      else { const data = await res.json().catch(() => null); toast.error(data?.details?.[0]?.message ?? data?.error ?? 'Erro ao salvar configuração'); }
    } catch { toast.error('Erro ao salvar configuração'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-tight font-bold flex items-center gap-2">
            <Settings className="h-7 w-7 text-primary" /> Configurar Treino
          </h1>
          <p className="text-muted-foreground">Escolha os dias e as modalidades. Restrições de horário são opcionais; a carga vem do histórico, objetivo e recuperação.</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Restrições de horário (opcional)</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">Mais tempo livre não significa treinar mais. O sistema prescreve a sessão primeiro e avisa se ela não couber no seu horário. Deixe vazio quando não houver uma restrição real.</p>
            <div className="max-w-xs space-y-2">
              <Label>Limite máximo por semana, se houver (horas)</Label>
              <Input type="number" step="0.5" min="0" value={weeklyHours} onChange={(e: any) => setWeeklyHours(e?.target?.value ?? '')} placeholder="Sem limite informado" />
            </div>

          </CardContent>
        </Card>
      </FadeIn>

      <PlanningPreferencesForm ref={preferencesRef} profile={profile} availableDays={availableDays} setAvailableDays={setAvailableDays} fixedDoubleDays={fixedDays.filter(day => schedule[day].length > 1)} />
      <FadeIn delay={0.2}>
        <Card id="modalidades-por-dia" className="scroll-mt-24">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Modalidades por dia</span>
              <span className="text-sm font-normal text-muted-foreground">{fixedDays.length} de {availableDays.length} dias definidos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Marque as modalidades nos dias em que quer fixá-las. Nos outros dias disponíveis, o Gotri completa a distribuição.</p>
            {profile?.modality === 'triatlo' && scheduleCoversWeek && !hasSwimDay && <p role="status" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">Os dias disponíveis já estão definidos e nenhum inclui natação. Marque natação em um dia em que possa nadar ou deixe um dia disponível para a distribuição automática.</p>}
            {DAYS.map((d) => (
              <div key={d.key} className="rounded-lg border p-3">
                <p className="font-medium mb-2">{d.label} <span className="font-normal text-sm text-muted-foreground">· {availableDays.includes(d.key) ? (schedule[d.key]?.length ? 'Modalidade definida' : 'Distribuição automática') : 'Indisponível'}</span></p>
                <div className="flex flex-wrap gap-2">
                  {MODALITIES.map((m) => {
                    const Icon = m.icon;
                    const active = (schedule[d.key] ?? []).includes(m.key);
                    return (
                      <button
                        key={m.key}
                        type="button"
                        disabled={!availableDays.includes(d.key) && !active}
                        aria-pressed={active}
                        onClick={() => toggleModality(d.key, m.key)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all',
                          active ? 'text-white border-transparent' : 'text-muted-foreground hover:border-primary/50',
                          !availableDays.includes(d.key) && !active && 'opacity-50 cursor-not-allowed'
                        )}
                        style={active ? { backgroundColor: m.color } : {}}
                      >
                        <Icon className="h-4 w-4" /> {m.label}
                      </button>
                    );
                  })}
                </div>
                {(schedule[d.key] ?? []).includes('ciclismo') && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground" style={{ color: '#F97316' }}>Ciclismo:</span>
                    {[{ k: 'rolo', l: 'Rolo (indoor)' }, { k: 'rua', l: 'Rua' }].map((o) => (
                      <button key={o.k} onClick={() => setBikeEnv((p) => ({ ...p, [d.key]: o.k }))}
                        className={cn('rounded-full border px-2.5 py-1 transition-all', (bikeEnv[d.key] ?? 'rolo') === o.k ? 'bg-[#F97316] text-white border-transparent' : 'text-muted-foreground hover:border-primary/50')}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                )}
                {(schedule[d.key] ?? []).includes('corrida') && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground" style={{ color: '#22C55E' }}>Corrida:</span>
                    {[{ k: 'rua', l: 'Rua' }, { k: 'esteira', l: 'Esteira' }].map((o) => (
                      <button key={o.k} onClick={() => setRunEnv((p) => ({ ...p, [d.key]: o.k }))}
                        className={cn('rounded-full border px-2.5 py-1 transition-all', (runEnv[d.key] ?? 'rua') === o.k ? 'bg-[#22C55E] text-white border-transparent' : 'text-muted-foreground hover:border-primary/50')}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </FadeIn>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg"><Save className="mr-2 h-4 w-4" /> Salvar Configuração</Button>
      </div>
    </div>
  );
}
