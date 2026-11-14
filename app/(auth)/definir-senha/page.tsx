'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { BrandLogo } from '@/components/brand-logo';

export default function DefinirSenhaPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('As senhas não coincidem'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return; }
    const token = new URLSearchParams(window.location.hash.slice(1)).get('convite');
    if (!token) { setError('Abra o link de convite enviado pelo seu coach. Se expirou, solicite um novo convite.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, token }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || 'Erro ao definir senha'); setLoading(false); return; }
      window.history.replaceState(null, '', window.location.pathname);
      const login = await signIn('credentials', { email: email.trim().toLowerCase(), password, redirect: false });
      if (login?.error) { router.push('/login'); }
      else { router.push('/dashboard'); }
    } catch { setError('Erro ao definir senha'); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center hero-gradient p-4">
      <Card className="w-full max-w-md overflow-hidden">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-1"><BrandLogo variant="stacked" showSlogan /></div>
          <CardDescription className="pt-1">Primeiro acesso — defina sua senha</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 text-center">Abra o link de convite enviado pelo seu coach e informe o e-mail cadastrado para criar sua senha. O link vale por 48 horas e pode ser utilizado uma vez.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="email">Email cadastrado</Label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" autoCapitalize="none" placeholder="seu@email.com" value={email} onChange={(e: any) => setEmail(e?.target?.value ?? '')} className="pl-10" required /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e: any) => setPassword(e?.target?.value ?? '')} className="pl-10" required /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="confirm" type="password" placeholder="••••••••" value={confirm} onChange={(e: any) => setConfirm(e?.target?.value ?? '')} className="pl-10" required /></div>
            </div>
            <Button type="submit" className="w-full" loading={loading}>Definir senha e entrar</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">Já tem senha? <Link href="/login" className="text-primary font-medium hover:underline">Entrar</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
