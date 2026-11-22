'use client';
import { useState } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Waves, Bike, Timer, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from '@/components/ui/card';
import { BrandLogo } from '@/components/brand-logo';
import { ThemePreference } from '@/components/theme-preference';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'atleta' | 'coach'>('atleta');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const isCoach = mode === 'coach';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const identifier = String(form.get('identifier') ?? email).trim();
    const secret = String(form.get('password') ?? password);
    setLoading(true);
    setError('');
    try {
      const res = await signIn('credentials', {
        email: identifier,
        password: secret,
        redirect: false,
      });
      if (res?.error === 'CredentialsSignin') {
        setError(
          'E-mail, usuário ou senha incorretos. Confira os dados ou use “Esqueci minha senha”. Se é seu primeiro acesso, abra o convite do coach.',
        );
      } else if (!res?.ok || res.error) {
        setError(
          'O serviço de acesso está indisponível. Tente novamente em instantes.',
        );
      } else if (!(await getSession())?.user?.id) {
        setError(
          'Não foi possível manter sua sessão. Permita cookies deste site e tente entrar novamente.',
        );
      } else {
        router.replace('/entrada');
        router.refresh();
      }
    } catch {
      setError(
        'Não foi possível conectar ao aplicativo. Confira sua conexão e tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid items-center gap-6 sm:gap-10 bg-background px-5 py-6 sm:py-12 lg:grid-cols-2 lg:px-[8vw]">
      <section className="mx-auto w-full max-w-lg">
        <div className="flex justify-between items-center">
          <BrandLogo variant="stacked" />
          <ThemePreference />
        </div>
        <p className="eyebrow mt-6 sm:mt-12 mb-3 sm:mb-5">
          CORRIDA · CICLISMO · NATAÇÃO
        </p>
        <h1 className="font-display text-3xl sm:text-6xl font-semibold leading-[1.08] tracking-tight">
          Seu esforço.
          <br />
          <span className="text-primary">Uma direção clara.</span>
        </h1>
        <p className="hidden sm:block mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">
          Planejamento que parte da sua rotina. Treinos com propósito,
          recuperação em vista e espaço para evoluir.
        </p>
        <div
          className="mt-9 hidden sm:flex gap-5 text-primary"
          aria-hidden="true"
        >
          <Waves className="h-7 w-7" />
          <Bike className="h-7 w-7" />
          <Timer className="h-7 w-7" />
        </div>
        <p className="hidden sm:block mt-6 text-xs text-muted-foreground">
          R10 TRI · identidade provisória
        </p>
      </section>
      <Card className="w-full max-w-md mx-auto overflow-hidden shadow-sm">
        <CardHeader className="text-center">
          <h2 className="font-display text-2xl font-semibold">
            Entre no seu espaço
          </h2>
          <CardDescription className="pt-1">
            Seu próximo treino começa com contexto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-1 p-1 mb-4 rounded-lg bg-muted">
            <button
              type="button"
              onClick={() => {
                setMode('atleta');
                setError('');
              }}
              className={`text-sm font-medium py-2 rounded-md transition-colors ${!isCoach ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Atleta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('coach');
                setError('');
              }}
              className={`text-sm font-medium py-2 rounded-md transition-colors ${isCoach ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Coach
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p
                role="alert"
                className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded"
              >
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">
                {isCoach ? 'E-mail ou usuário do coach' : 'E-mail ou usuário'}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={
                    isCoach
                      ? 'Seu usuário ou e-mail cadastrado'
                      : 'seu@email.com'
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 text-base md:text-sm"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use o e-mail cadastrado ou um usuário atribuído à sua conta. Não
                existe usuário ou senha padrão.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-12 text-base md:text-sm"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full min-w-11 flex items-center justify-center rounded-md text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              Entrar
            </Button>
            <p className="text-center text-sm">
              <Link
                href="/esqueci-senha"
                className="text-primary font-medium hover:underline"
              >
                Esqueci minha senha
              </Link>
            </p>
          </form>
          {!isCoach && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Primeiro acesso (atleta convidado)?{' '}
              <Link
                href="/definir-senha"
                className="text-primary font-medium hover:underline"
              >
                Definir senha
              </Link>
            </p>
          )}
          {isCoach && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              Acesso exclusivo do treinador.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
