'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BrandLogo } from '@/components/brand-logo';

export default function RedefinirSenhaPage() {
  const reset = useRef<{ userId: string; token: string } | null>(null);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const userId = fragment.get('conta');
    const token = fragment.get('token');
    if (userId && token) reset.current = { userId, token };
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const confirmation = String(form.get('confirmation') || '');
    setError('');
    if (!reset.current) { setError('Abra o link recebido por e-mail. Se expirou, solicite um novo link.'); return; }
    if (password !== confirmation) { setError('As senhas não coincidem.'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', cache: 'no-store',
        body: JSON.stringify({ ...reset.current, password }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error || 'Não foi possível redefinir a senha.'); return; }
      reset.current = null;
      setComplete(true);
    } catch { setError('Não foi possível conectar ao aplicativo. Confira sua conexão e tente novamente.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center hero-gradient p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2"><BrandLogo variant="stacked" showSlogan /></div>
          <CardTitle className="text-xl">Redefinir minha senha</CardTitle>
          <CardDescription>O link é válido por 30 minutos e pode ser usado uma vez.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {complete ? (
            <div role="status" className="space-y-4 text-center">
              <p>Sua senha foi atualizada. As sessões anteriores foram encerradas.</p>
              <Button asChild className="w-full"><Link href="/login">Entrar com a nova senha</Link></Button>
            </div>
          ) : (
            <>
              {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="password">Nova senha</Label><Input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} className="text-base md:text-sm" /><p className="text-xs text-muted-foreground">Use uma senha exclusiva com pelo menos 6 caracteres. Frases longas são mais fáceis de lembrar.</p></div>
                <div className="space-y-2"><Label htmlFor="confirmation">Confirmar nova senha</Label><Input id="confirmation" name="confirmation" type="password" autoComplete="new-password" required minLength={6} className="text-base md:text-sm" /></div>
                <Button type="submit" className="w-full" loading={loading}>Salvar nova senha</Button>
              </form>
              <p className="text-center text-sm"><Link href="/esqueci-senha" className="text-primary hover:underline">Solicitar outro link</Link></p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
