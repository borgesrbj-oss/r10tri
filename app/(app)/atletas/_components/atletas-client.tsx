'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Mail, Dumbbell, Trophy, Weight, Activity, UserPlus, Settings, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { FadeIn } from '@/components/ui/animate';
import { SafeDate } from '@/components/safe-format';
import { useToast } from '@/hooks/use-toast';

type Athlete = {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
  hasPassword: boolean;
  level: string | null;
  modality: string | null;
  currentWeight: number | null;
  nextRace: { name: string; date: string | null } | null;
  logs: number;
  plans: number;
};

const MODALITY_LABEL: Record<string, string> = {
  triatlo: 'Triatlo',
  natacao: 'Natação',
  ciclismo: 'Ciclismo',
  corrida: 'Corrida',
};

const LEVEL_LABEL: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

export function AtletasClient({ athletes }: { athletes: Athlete[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<{ email: string; url: string } | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch('/api/athlete/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao excluir atleta');
      toast({ title: 'Atleta excluído', description: 'A conta e todos os dados relacionados foram removidos.' });
      router.refresh();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast({ title: 'Preencha nome e e-mail', variant: 'destructive' });
      return;
    }
    await sendInvitation(name.trim(), email.trim().toLowerCase(), whatsapp.trim());
  }

  async function sendInvitation(athleteName: string, athleteEmail: string, athleteWhatsapp = '') {
    setLoading(true);
    try {
      const res = await fetch('/api/athlete/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: athleteName, email: athleteEmail, whatsapp: athleteWhatsapp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao cadastrar atleta');
      const emailMsg = data?.emailSent ? 'E-mail de boas-vindas enviado.' : 'Compartilhe o link de convite abaixo com o atleta.';
      setInvitation({ email: athleteEmail, url: data.invitationUrl });
      toast({ title: 'Convite criado!', description: emailMsg });
      if (data?.waLink) {
        window.open(data.waLink, '_blank');
        toast({ title: 'WhatsApp', description: 'Abrindo mensagem de boas-vindas no WhatsApp.' });
      }
      setName('');
      setEmail('');
      setWhatsapp('');
      router.refresh();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-tight font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> Gerenciar Atletas
          </h1>
          <p className="text-muted-foreground">Acompanhe e gerencie os atletas cadastrados na plataforma</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.04}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" /> Cadastrar novo atleta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="at-name">Nome</Label>
                <Input id="at-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do atleta" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="at-email">E-mail</Label>
                <Input id="at-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="at-whatsapp">WhatsApp</Label>
                <Input id="at-whatsapp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              <Button type="submit" disabled={loading}>{loading ? 'Cadastrando...' : 'Cadastrar'}</Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">Ao cadastrar, criamos um convite de uso único válido por 48 horas. Se o envio de e-mail estiver configurado, enviamos o link; com WhatsApp, abrimos a mensagem pronta para envio. Compartilhe o convite apenas com o atleta.</p>
            {invitation && (
              <div className="mt-4 space-y-2 rounded-lg border border-primary/30 p-3">
                <Label htmlFor="invitation-link">Convite para {invitation.email}</Label>
                <Input id="invitation-link" value={invitation.url} readOnly onFocus={(event) => event.target.select()} />
                <p className="text-xs text-muted-foreground">Copie e envie ao atleta. Renovar um convite invalida os links anteriores.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="p-4"><p className="text-2xl font-bold text-primary">{athletes.length}</p><p className="text-xs text-muted-foreground">Atletas</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-2xl font-bold text-primary">{athletes.filter((a) => a.plans > 0).length}</p><p className="text-xs text-muted-foreground">Com plano ativo</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-2xl font-bold text-primary">{athletes.reduce((s, a) => s + a.logs, 0)}</p><p className="text-xs text-muted-foreground">Treinos registrados</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-2xl font-bold text-primary">{athletes.filter((a) => a.nextRace).length}</p><p className="text-xs text-muted-foreground">Com prova-alvo</p></CardContent></Card>
        </div>
      </FadeIn>

      {athletes.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">Nenhum atleta cadastrado ainda.</CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {athletes.map((a, i) => (
            <FadeIn key={a.id} delay={0.03 * i}>
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    {a.photoUrl ? (
                      <Image src={a.photoUrl} alt={a.name} width={44} height={44} unoptimized className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-lg">
                        {a.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{a.name}</CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate"><Mail className="h-3 w-3 shrink-0" /> {a.email}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col">
                  <div className="flex flex-wrap gap-2">
                    {a.modality && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{MODALITY_LABEL[a.modality] ?? a.modality}</Badge>}
                    {a.level && <Badge variant="outline">{LEVEL_LABEL[a.level] ?? a.level}</Badge>}
                    {!a.hasPassword && <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">Aguardando 1º acesso</Badge>}
                  </div>
                  {!a.hasPassword && <Button variant="outline" size="sm" disabled={loading} onClick={() => sendInvitation(a.name, a.email)}>Renovar convite</Button>}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground"><Activity className="h-4 w-4" /> {a.logs} treinos</div>
                    <div className="flex items-center gap-1.5 text-muted-foreground"><Dumbbell className="h-4 w-4" /> {a.plans} plano(s)</div>
                    {a.currentWeight != null && <div className="flex items-center gap-1.5 text-muted-foreground"><Weight className="h-4 w-4" /> {a.currentWeight} kg</div>}
                  </div>
                  {a.nextRace && (
                    <div className="rounded-lg bg-accent/50 p-2.5 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{a.nextRace.name}</p>
                        {a.nextRace.date && <p className="text-xs text-muted-foreground"><SafeDate date={a.nextRace.date} options={{ dateStyle: 'medium' }} /></p>}
                      </div>
                    </div>
                  )}
                  <div className="mt-auto pt-2 flex gap-2">
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/atletas/${a.id}`}><Settings className="h-4 w-4 mr-2" /> Gerenciar treinos</Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30" disabled={deletingId === a.id} aria-label={`Excluir ${a.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir atleta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação remove permanentemente <strong>{a.name}</strong> ({a.email}) e todos os dados relacionados: perfil, provas, planos, treinos e registros. Não é possível desfazer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(a.id)}>
                            Excluir definitivamente
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}
