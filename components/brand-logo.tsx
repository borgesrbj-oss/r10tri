'use client';
import { cn } from '@/lib/utils';

/**
 * Logotipo R10 TRI — minimalista e tipográfico (inspirado na identidade da marca).
 * variant: 'inline' (nav) | 'stacked' (telas de auth, com slogan)
 */
export function BrandLogo({
  variant = 'inline',
  showSlogan = false,
  className,
}: {
  variant?: 'inline' | 'stacked';
  showSlogan?: boolean;
  className?: string;
}) {
  if (variant === 'stacked') {
    return (
      <div className={cn('flex flex-col items-center', className)}>
        <div className="font-display font-black tracking-tighter leading-none text-4xl flex items-baseline gap-1.5">
          <span className="text-primary">R10</span>
          <span className="text-foreground">TRI</span>
        </div>
        <p className="mt-2 text-[10px] font-semibold tracking-[0.3em] text-muted-foreground uppercase">
          Treinamento Personalizado
        </p>
        {showSlogan && (
          <>
            <span className="my-2 h-px w-16 bg-border" />
            <p className="text-sm font-medium tracking-wide text-primary">
              Nade. Pedale. Corra. Evolua.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center', className)}>
      <span className="font-display font-black tracking-tighter leading-none text-xl flex items-baseline gap-1">
        <span className="text-primary">R10</span>
        <span className="text-foreground">TRI</span>
      </span>
      <span className="ml-2 hidden sm:inline-block h-4 w-px bg-border" />
      <span className="ml-2 hidden sm:inline-block text-[9px] font-semibold tracking-[0.25em] text-muted-foreground uppercase">
        Triathlon
      </span>
    </div>
  );
}
