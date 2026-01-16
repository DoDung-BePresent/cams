/**
 * Components
 */
import { Logo } from '@/components/common/logo';

/**
 * Libs
 */
import { cn } from '@/lib/utils';

type HeaderProps = {
  className?: string;
};

export const Header = ({ className }: HeaderProps) => {
  return (
    <header
      className={cn(
        'border-primary bg-background mx-auto max-w-6xl border-2 p-3',
        className,
      )}
    >
      <Logo />
    </header>
  );
};
