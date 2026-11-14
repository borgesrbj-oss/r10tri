'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BrandLogo } from '@/components/brand-logo';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, whatsapp }) });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || 'Erro ao criar conta'); return; }
      const signInRes = await signIn('credentials', { email, password, redirect: false });
      if (signInRes?.error) { router.push('/login'); } else { router.push('/dashboard'); }
    } catch { setError('Erro ao criar conta'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center hero-gradient p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2"><BrandLogo variant="stacked" showSlogan /></div>
          <CardTitle className="font-display text-xl tracking-tight pt-2">Criar Conta</CardTitle>
          <CardDescription>Comece seu treinamento de triathlon</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded">{error}</p>}
            <div className="space-y-2"><Label htmlFor="name">Nome</Label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="name" placeholder="Seu nome" value={name} onChange={(e: any) => setName(e?.target?.value ?? '')} className="pl-10" required /></div></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e: any) => setEmail(e?.target?.value ?? '')} className="pl-10" required /></div></div>
            <div className="space-y-2"><Label htmlFor="whatsapp">WhatsApp</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="whatsapp" type="tel" placeholder="(11) 99999-9999" value={whatsapp} onChange={(e: any) => setWhatsapp(e?.target?.value ?? '')} className="pl-10" /></div></div>
            <div className="space-y-2"><Label htmlFor="password">Senha</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e: any) => setPassword(e?.target?.value ?? '')} className="pl-10" minLength={6} required /></div></div>
            <Button type="submit" className="w-full" loading={loading}>Criar Conta</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">Já tem conta? <Link href="/login" className="text-primary font-medium hover:underline">Fazer login</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
