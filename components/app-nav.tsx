'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  CalendarDays,
  Dumbbell,
  ChartNoAxesCombined,
  UserRound,
  Flag,
  Table,
  Apple,
  BookOpen,
  Users,
  Link2,
  Menu,
  X,
  LogOut,
  Settings,
  Mail,
} from 'lucide-react';
import { BrandLogo } from './brand-logo';
import { ThemePreference } from './theme-preference';
import { cn } from '@/lib/utils';
const primary = [
  { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/calendario', label: 'Calendário', icon: CalendarDays },
  { href: '/plano', label: 'Treinos', icon: Dumbbell },
  { href: '/evolucao', label: 'Desempenho', icon: ChartNoAxesCombined },
  { href: '/perfil', label: 'Perfil', icon: UserRound },
];
const secondary = [
  { href: '/provas', label: 'Competições', icon: Flag },
  { href: '/planilha', label: 'Planilha e exportações', icon: Table },
  { href: '/configurar-treino', label: 'Disponibilidade', icon: Settings },
  { href: '/nutricao', label: 'Alimentação', icon: Apple },
  { href: '/exercicios', label: 'Força e mobilidade', icon: Dumbbell },
  { href: '/strava', label: 'Integrações', icon: Link2 },
  { href: '/guias', label: 'Guias', icon: BookOpen },
];
export function AppNav() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { data: session } = useSession();
  const coach = session?.user?.role === 'coach';
  const main = coach
    ? [
        { href: '/coach', label: 'Painel do coach', icon: Users },
        { href: '/coach#alunos', label: 'Meus atletas', icon: UserRound },
        { href: '/coach#convite', label: 'Cadastrar / convidar', icon: Mail },
      ]
    : primary;
  const items = coach
    ? [...secondary, { href: '/coach', label: 'Área do Coach', icon: Users }]
    : secondary;
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);
  const active = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');
  const links = (entries: typeof primary) =>
    entries.map(({ href, label, icon: Icon }) => (
      <Link
        key={href}
        href={href}
        onClick={() => setOpen(false)}
        aria-current={active(href) ? 'page' : undefined}
        className={cn(
          'nav-item flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
          active(href)
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        {label}
      </Link>
    ));
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 z-[100] bg-card text-primary p-3 rounded-lg"
      >
        Ir para conteúdo
      </a>
      <header className="app-topbar sticky top-0 z-40 border-b bg-background lg:fixed lg:inset-y-0 lg:left-0 lg:w-56 lg:border-r lg:border-b-0 lg:flex lg:flex-col">
        <div className="app-topbar-inner flex min-h-16 items-center justify-between gap-2 px-4 lg:px-6 lg:py-4">
          <Link
            href={coach ? '/coach' : '/dashboard'}
            aria-label="R10 TRI, abrir painel"
          >
            <BrandLogo />
          </Link>
          <button
            ref={button}
            type="button"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            aria-controls="app-mobile-navigation"
            className="lg:hidden p-3 rounded-xl hover:bg-muted"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <div
          className={cn(
            'flex-1 overflow-y-auto max-h-[calc(100dvh-8rem)] lg:max-h-none px-4 pb-4',
            open ? 'block' : 'hidden lg:block',
          )}
          id="app-mobile-navigation"
        >
          <p className="eyebrow px-3 mt-4 mb-3">SEU ESPAÇO</p>
          <nav aria-label="Navegação principal" className="space-y-1">
            {links(main)}
          </nav>
          <p className="eyebrow px-3 mt-7 mb-3">FERRAMENTAS</p>
          <nav aria-label="Ferramentas complementares" className="space-y-1">
            {links(items)}
          </nav>
          <div className="mt-6 px-2 flex items-center justify-between">
            <ThemePreference />
            <button
              type="button"
              className="min-h-11 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive"
              onClick={() => signOut({ redirectTo: '/login' })}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
        <p className="hidden lg:block px-7 py-5 text-[11px] text-muted-foreground border-t">
          Consistência. Contexto. Evolução.
        </p>
      </header>
      <nav
        className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t bg-background lg:hidden"
        style={{ gridTemplateColumns: `repeat(${main.length},minmax(0,1fr))` }}
        aria-label="Acesso rápido"
      >
        {main.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active(href) ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-3 min-h-16 text-[10px]',
              active(href)
                ? 'text-primary font-semibold'
                : 'text-muted-foreground',
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
