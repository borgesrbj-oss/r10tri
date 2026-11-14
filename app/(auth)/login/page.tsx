'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Waves, Bike, Timer, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { BrandLogo } from '@/components/brand-logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'atleta' | 'coach'>('atleta');
  const router = useRouter();
  const isCoach = mode === 'coach';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await signIn('credentials', { email, password, redirect: false });
      if (res?.error) { setError('Email ou senha incorretos'); }
      else { router.push('/dashboard'); }
    } catch { setError('Erro ao fazer login'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center hero-gradient p-4">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="relative flex items-center justify-center gap-6 py-8 bg-gradient-to-br from-[#1A8A7D]/20 via-background to-background border-b">
          <Waves className="h-10 w-10 sport-anim" style={{ color: '#3B82F6', animationDelay: '0s' }} />
          <Bike className="h-10 w-10 sport-anim" style={{ color: '#F97316', animationDelay: '1s' }} />
          <Timer className="h-10 w-10 sport-anim" style={{ color: '#22C55E', animationDelay: '2s' }} />
        </div>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-1"><BrandLogo variant="stacked" showSlogan /></div>
          <CardDescription className="pt-1">Seu coach pessoal de triathlon com IA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-1 p-1 mb-4 rounded-lg bg-muted">
            <button type="button" onClick={() => { setMode('atleta'); setError(''); }} className={`text-sm font-medium py-2 rounded-md transition-colors ${!isCoach ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Atleta</button>
            <button type="button" onClick={() => { setMode('coach'); setError(''); }} className={`text-sm font-medium py-2 rounded-md transition-colors ${isCoach ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Coach</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="email">{isCoach ? 'Usuário do coach' : 'Email ou usuário'}</Label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="text" autoCapitalize="none" placeholder={isCoach ? 'R10ADM' : 'seu@email.com'} value={email} onChange={(e: any) => setEmail(e?.target?.value ?? '')} className="pl-10" required /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e: any) => setPassword(e?.target?.value ?? '')} className="pl-10" required /></div>
            </div>
            <Button type="submit" className="w-full" loading={loading}>Entrar</Button>
          </form>
          {!isCoach && (
          <p className="text-center text-sm text-muted-foreground mt-4">Primeiro acesso (atleta convidado)? <Link href="/definir-senha" className="text-primary font-medium hover:underline">Definir senha</Link></p>
          )}
          {isCoach && (<p className="text-center text-xs text-muted-foreground mt-4">Acesso exclusivo do treinador.</p>)}
        </CardContent>
      </Card>
    </div>
  );
}
