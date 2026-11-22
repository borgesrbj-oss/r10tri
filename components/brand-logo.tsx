import Image from 'next/image';
import { cn } from '@/lib/utils';
/** Logo fornecida pelo usuário, adaptada à paleta grafite/laranja do app. */
export function BrandLogo({
  variant = 'inline',
  showSlogan = false,
  className,
}: {
  variant?: 'inline' | 'stacked';
  showSlogan?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col',
        variant === 'stacked' ? 'items-center' : 'items-start',
        className,
      )}
    >
      <Image
        src="/brand/gotri-laranja.png"
        alt="GoTri — natação, ciclismo e corrida"
        width={1902}
        height={827}
        priority
        sizes={variant === 'stacked' ? '260px' : '160px'}
        className={cn(
          'h-auto rounded-md object-contain',
          variant === 'stacked'
            ? 'w-[260px] max-w-full'
            : 'w-[150px] sm:w-[160px]',
        )}
      />
      {showSlogan && (
        <p className="mt-2 text-sm font-medium text-primary">
          Nade. Pedale. Corra. Evolua.
        </p>
      )}
    </div>
  );
}
