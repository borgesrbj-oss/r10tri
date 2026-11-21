'use client';
import {PlanningPreferencesForm} from '@/components/planning-preferences-form';

import { useState } from 'react';
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
  try { return JSON.parse(raw) ?? {}; } catch { return {}; }
}

function parseEnv(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {};
  try { return JSON.parse(raw) ?? {}; } catch { return {}; }
}

export function ConfigurarTreinoClient({ profile }: { profile: any }) {
  const [schedule, setSchedule] = useState<Record<string, string[]>>(parseSchedule(profile?.daySchedule));
  const [bikeEnv, setBikeEnv] = useState<Record<string, string>>(parseEnv(profile?.bikeEnvByDay));
  const [runEnv, setRunEnv] = useState<Record<string, string>>(parseEnv(profile?.runEnvByDay));
  const [weeklyHours, setWeeklyHours] = useState<string>(profile?.weeklyHours != null ? String(profile.weeklyHours) : '');
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

  const activeDays = Object.keys(schedule).filter((d) => (schedule[d] ?? []).length > 0).length;

  const handleSave = async () => {
    setSaving(true);
    try {
      const availableDays = profile?.availableDays ?? [];
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daySchedule: JSON.stringify(schedule),
          bikeEnvByDay: JSON.stringify(bikeEnv),
          runEnvByDay: JSON.stringify(runEnv),
          weeklyHours: weeklyHours ? Number(weeklyHours) : null,
          availableDays,
        }),
      });
      if (res.ok) { toast.success('Configuração de treino salva!'); router.refresh(); }
      else toast.error('Erro ao salvar configuração');
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
          <p className="text-muted-foreground">Defina os dias disponíveis, as modalidades de cada dia e o volume semanal</p>
        </div>
      </FadeIn><PlanningPreferencesForm profile={profile} />

      <FadeIn delay={0.1}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Volume Semanal</CardTitle></CardHeader>
          <CardContent>
            <div className="max-w-xs space-y-2">
              <Label>Horas disponíveis por semana</Label>
              <Input type="number" step="0.5" min="0" value={weeklyHours} onChange={(e: any) => setWeeklyHours(e?.target?.value ?? '')} placeholder="Ex.: 8" />
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Modalidades por Dia</span>
              <span className="text-sm font-normal text-muted-foreground">{activeDays} dia(s) ativo(s)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {DAYS.map((d) => (
              <div key={d.key} className="rounded-lg border p-3">
                <p className="font-medium mb-2">{d.label}</p>
                <div className="flex flex-wrap gap-2">
                  {MODALITIES.map((m) => {
                    const Icon = m.icon;
                    const active = (schedule[d.key] ?? []).includes(m.key);
                    return (
                      <button
                        key={m.key}
                        onClick={() => toggleModality(d.key, m.key)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all',
                          active ? 'text-white border-transparent' : 'text-muted-foreground hover:border-primary/50'
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
