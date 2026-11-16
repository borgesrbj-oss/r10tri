'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Timer, Target, TrendingUp, Calendar, Settings, Menu, X, LogOut, Dumbbell, BookOpen, Activity, Users, Table, Apple } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/brand-logo';

const navItems = [
  { href: '/dashboard', label: 'Painel', icon: TrendingUp },
  { href: '/perfil', label: 'Perfil', icon: Settings },
  { href: '/provas', label: 'Provas', icon: Target },
  { href: '/plano', label: 'Plano', icon: Dumbbell },
  { href: '/planilha', label: 'Planilha', icon: Table },
  { href: '/nutricao', label: 'Nutrição', icon: Apple },
  { href: '/exercicios', label: 'Força', icon: Activity },
  { href: '/calendario', label: 'Calendário', icon: Calendar },
  { href: '/evolucao', label: 'Evolução', icon: TrendingUp },
  { href: '/strava', label: 'Strava', icon: Timer },
  { href: '/guias', label: 'Guias', icon: BookOpen },
];

export function AppNav() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const isCoach = (session?.user as any)?.role === 'coach';
  const items = isCoach ? [...navItems, { href: '/atletas', label: 'Atletas', icon: Users }] : navItems;

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="app-topbar sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="app-topbar-inner mx-auto flex min-h-14 max-w-[1200px] items-center justify-between gap-3 px-4">
        <Link href="/dashboard" className="flex shrink-0 items-center" aria-label="R10 TRI, abrir painel">
          <BrandLogo variant="inline" />
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1 xl:flex" aria-label="Navegação principal">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} aria-current={active(item.href) ? 'page' : undefined} className={cn(buttonVariants({ variant: active(item.href) ? 'secondary' : 'ghost', size: 'sm' }), 'shrink-0 gap-1.5', active(item.href) && 'bg-accent text-accent-foreground')}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Button variant="ghost" size="sm" className="hidden shrink-0 gap-1.5 text-destructive xl:inline-flex" onClick={() => signOut({ redirectTo: '/login' })}>
          <LogOut className="h-4 w-4" aria-hidden="true" /> Sair
        </Button>
        <Button ref={menuButton} type="button" variant="ghost" size="icon" className="min-h-11 min-w-11 xl:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} aria-controls="app-mobile-navigation">
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </Button>
      </div>
      {open && (
        <nav id="app-mobile-navigation" className="app-mobile-menu flex flex-col gap-1 border-t bg-background p-3 xl:hidden" aria-label="Navegação do celular">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={active(item.href) ? 'page' : undefined} className={cn(buttonVariants({ variant: active(item.href) ? 'secondary' : 'ghost', size: 'sm' }), 'min-h-11 w-full justify-start gap-2')}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          <Button variant="ghost" size="sm" className="min-h-11 w-full justify-start gap-2 text-destructive" onClick={() => signOut({ redirectTo: '/login' })}>
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sair
          </Button>
        </nav>
      )}
    </header>
  );
}
