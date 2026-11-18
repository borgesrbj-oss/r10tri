'use client';
import { useState } from 'react';
import Image from 'next/image';
import { saveNickname, useStoredNickname } from '@/hooks/use-browser-state';
import { User, Scale, Calendar, Zap, Save, AlertCircle, Camera, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';
import { useRouter } from 'next/navigation';

const DAYS = [
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
];

const LEVELS = [
  { key: 'iniciante', label: 'Iniciante' },
  { key: 'intermediario', label: 'Intermediário' },
  { key: 'avancado', label: 'Avançado' },
];

export function PerfilClient({ profile }: { profile: any; userName: string }) {
  const [form, setForm] = useState({
    birthDate: profile?.birthDate ? new Date(profile.birthDate).toISOString().slice(0, 10) : '',
    sex: profile?.sex ?? '',
    whatsapp: profile?.whatsapp ?? '',
    currentWeight: profile?.currentWeight ?? '',
    targetWeight: profile?.targetWeight ?? '',
    level: profile?.level ?? 'intermediario',
    availableDays: profile?.availableDays ?? [],
    limitations: profile?.limitations ?? '',
    ftp: profile?.ftp ?? '',
    vo2max: profile?.vo2max ?? '',
    swimPace: profile?.swimPace ?? '',
    runPace: profile?.runPace ?? '',
    raceHistory: profile?.raceHistory ?? '',
  });
  const [saving, setSaving] = useState(false);
  const storedNickname = useStoredNickname();
  const [nicknameDraft, setApelido] = useState<string | null>(null);
  const apelido = nicknameDraft ?? (profile?.nickname || storedNickname);
  const [photoUrl, setPhotoUrl] = useState<string>(profile?.photoUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handlePhoto = async (e: any) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Imagem muito grande (max 10MB)'); return; }
    setUploading(true);
    try {
      const presign = await fetch('/api/upload/presigned', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: file.name, contentType: file.type }) });
      const pdata = await presign.json();
      if (!presign.ok) { toast.error(pdata?.error ?? 'Erro ao enviar foto'); return; }
      const put = await fetch(pdata.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!put.ok) { toast.error('Falha no upload da foto'); return; }
      setPhotoUrl(pdata.publicUrl);
      toast.success('Foto carregada! Clique em Salvar Perfil para confirmar.');
    } catch { toast.error('Erro ao enviar foto'); }
    finally { setUploading(false); }
  };

  const toggleDay = (day: string) => {
    setForm((p: any) => ({
      ...p,
      availableDays: (p?.availableDays ?? []).includes(day)
        ? (p?.availableDays ?? []).filter((d: string) => d !== day)
        : [...(p?.availableDays ?? []), day],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          nickname: apelido.trim() || null,
          photoUrl: photoUrl || null,
          currentWeight: form.currentWeight ? Number(form.currentWeight) : null,
          targetWeight: form.targetWeight ? Number(form.targetWeight) : null,
          ftp: form.ftp ? Number(form.ftp) : null,
          vo2max: form.vo2max ? Number(form.vo2max) : null,
        }),
      });
      if (res.ok) { saveNickname(apelido.trim()); toast.success('Perfil salvo com sucesso!'); router.refresh(); }
      else toast.error('Erro ao salvar perfil');
    } catch { toast.error('Erro ao salvar perfil'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-tight font-bold flex items-center gap-2"><User className="h-7 w-7 text-primary" /> Perfil do Atleta</h1>
          <p className="text-muted-foreground">Configure seus dados para treinos personalizados</p>
        </div>
      </FadeIn>

      {!profile?.profileCompleted && (
        <FadeIn>
          <div className="rounded-lg border border-primary/40 bg-primary/10 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Bem-vindo(a)! Complete seu perfil para começar.</p>
              <p className="text-muted-foreground">Inclua sua <strong>data de nascimento</strong> e <strong>sexo</strong> — eles ajudam a IA a montar o melhor plano progressivo para você. Depois clique em <strong>Salvar Perfil</strong>.</p>
            </div>
          </div>
        </FadeIn>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5" /> Dados Físicos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 rounded-full overflow-hidden bg-muted border-2 border-primary/30 flex items-center justify-center">
                  {photoUrl ? (
                    <Image src={photoUrl} alt="Foto de perfil" width={80} height={80} unoptimized className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-9 w-9 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Foto de perfil</Label>
                  <div>
                    <input id="photo-input" type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                    <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => document.getElementById('photo-input')?.click()}>
                      {uploading ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Enviando...</> : <><Camera className="mr-1.5 h-4 w-4" /> {photoUrl ? 'Trocar foto' : 'Adicionar foto'}</>}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2"><Label>Apelido (como quer ser chamado)</Label><Input value={apelido} onChange={(e: any) => setApelido(e?.target?.value ?? '')} placeholder="Ex.: Ricardo" /></div>
              <div className="space-y-2"><Label>WhatsApp (com DDD)</Label><Input value={form.whatsapp} onChange={(e: any) => setForm((p: any) => ({ ...p, whatsapp: e?.target?.value ?? '' }))} placeholder="Ex.: (11) 98888-7777" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Data de Nascimento</Label><Input type="date" value={form.birthDate} onChange={(e: any) => setForm((p: any) => ({ ...p, birthDate: e?.target?.value ?? '' }))} /></div>
                <div className="space-y-2">
                  <Label>Sexo</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant={form.sex === 'masculino' ? 'default' : 'outline'} size="sm" onClick={() => setForm((p: any) => ({ ...p, sex: 'masculino' }))}>Masculino</Button>
                    <Button type="button" variant={form.sex === 'feminino' ? 'default' : 'outline'} size="sm" onClick={() => setForm((p: any) => ({ ...p, sex: 'feminino' }))}>Feminino</Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Peso Atual (kg)</Label><Input type="number" step="0.1" value={form.currentWeight} onChange={(e: any) => setForm((p: any) => ({ ...p, currentWeight: e?.target?.value ?? '' }))} placeholder="75.0" /></div>
                <div className="space-y-2"><Label>Peso Meta (kg)</Label><Input type="number" step="0.1" value={form.targetWeight} onChange={(e: any) => setForm((p: any) => ({ ...p, targetWeight: e?.target?.value ?? '' }))} placeholder="70.0" /></div>
              </div>
              <div className="space-y-2">
                <Label>Nível</Label>
                <div className="flex gap-2">
                  {LEVELS.map((l: any) => (
                    <Button key={l.key} variant={form.level === l.key ? 'default' : 'outline'} size="sm" onClick={() => setForm((p: any) => ({ ...p, level: l.key }))}>{l.label}</Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Limitações / Dificuldades</Label>
                <Textarea value={form.limitations} onChange={(e: any) => setForm((p: any) => ({ ...p, limitations: e?.target?.value ?? '' }))} placeholder="Ex.: problema no joelho direito, sem acesso a piscina..." rows={3} />
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Disponibilidade</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Dias Disponíveis</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d: any) => (
                    <Button key={d.key} variant={(form?.availableDays ?? []).includes(d.key) ? 'default' : 'outline'} size="sm" onClick={() => toggleDay(d.key)}>{d.label}</Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.3}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Métricas de Performance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>FTP (watts)</Label><Input type="number" value={form.ftp} onChange={(e: any) => setForm((p: any) => ({ ...p, ftp: e?.target?.value ?? '' }))} placeholder="200" /></div>
                <div className="space-y-2"><Label>VO2max</Label><Input type="number" step="0.1" value={form.vo2max} onChange={(e: any) => setForm((p: any) => ({ ...p, vo2max: e?.target?.value ?? '' }))} placeholder="45" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Pace Natação (por 100m)</Label><Input value={form.swimPace} onChange={(e: any) => setForm((p: any) => ({ ...p, swimPace: e?.target?.value ?? '' }))} placeholder="2:00" /></div>
                <div className="space-y-2"><Label>Pace Corrida (por km)</Label><Input value={form.runPace} onChange={(e: any) => setForm((p: any) => ({ ...p, runPace: e?.target?.value ?? '' }))} placeholder="5:30" /></div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.4}>
          <Card>
            <CardHeader><CardTitle>Histórico de Provas</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={form.raceHistory} onChange={(e: any) => setForm((p: any) => ({ ...p, raceHistory: e?.target?.value ?? '' }))} placeholder="Ex.: Ironman 70.3 Floripa 2024 - 6h30, Sprint Santos 2023..." rows={4} />
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg"><Save className="mr-2 h-4 w-4" /> Salvar Perfil</Button>
      </div>
    </div>
  );
}
