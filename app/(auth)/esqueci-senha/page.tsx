'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BrandLogo } from '@/components/brand-logo';

export default function EsqueciSenhaPage() {
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(''); setMessage(''); setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', cache: 'no-store',
        body: JSON.stringify({ identifier: String(data.get('identifier') ?? identifier).trim() }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error || 'Não foi possível solicitar a recuperação agora.'); return; }
      setMessage(result.message);
    } catch { setError('Não foi possível conectar ao aplicativo. Confira sua conexão e tente novamente.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center hero-gradient p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2"><BrandLogo variant="stacked" showSlogan /></div>
          <CardTitle className="text-xl">Esqueci minha senha</CardTitle>
          <CardDescription>O link será enviado ao e-mail cadastrado na sua conta e valerá por 30 minutos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <p role="status" className="rounded-md bg-primary/10 p-3 text-sm">{message}</p>}
          {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">E-mail ou usuário</Label>
              <Input id="identifier" name="identifier" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={identifier} onChange={event => setIdentifier(event.target.value)} required className="text-base md:text-sm" />
            </div>
            <Button type="submit" className="w-full" loading={loading}>Enviar link de recuperação</Button>
          </form>
          <p className="text-center text-sm"><Link href="/login" className="text-primary hover:underline">Voltar para entrar</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
