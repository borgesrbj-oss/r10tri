'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Timer, Target, TrendingUp, Calendar, Settings, Menu, X, LogOut, Dumbbell, BookOpen, Activity, Users, Table, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const isCoach = (session?.user as any)?.role === 'coach';
  const items = isCoach ? [...navItems, { href: '/atletas', label: 'Atletas', icon: Users }] : navItems;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center">
          <BrandLogo variant="inline" />
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {items?.map((item: any) => {
            const Icon = item?.icon;
            return (
              <Link key={item?.href} href={item?.href ?? '#'}>
                <Button variant={pathname === item?.href ? 'secondary' : 'ghost'} size="sm" className={cn('gap-1.5', pathname === item?.href && 'bg-accent text-accent-foreground')}>
                  {Icon && <Icon className="h-4 w-4" />}
                  {item?.label}
                </Button>
              </Link>
            );
          })}
          <Button variant="ghost" size="sm" className="gap-1.5 text-destructive" onClick={() => signOut({ redirectTo: '/login' })}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </nav>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      {open && (
        <nav className="md:hidden border-t bg-background p-3 flex flex-col gap-1">
          {items?.map((item: any) => {
            const Icon = item?.icon;
            return (
              <Link key={item?.href} href={item?.href ?? '#'} onClick={() => setOpen(false)}>
                <Button variant={pathname === item?.href ? 'secondary' : 'ghost'} size="sm" className="w-full justify-start gap-2">
                  {Icon && <Icon className="h-4 w-4" />}
                  {item?.label}
                </Button>
              </Link>
            );
          })}
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-destructive" onClick={() => signOut({ redirectTo: '/login' })}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </nav>
      )}
    </header>
  );
}
