/**
 * Assets
 */
import LogoIcon from '@/assets/logo.svg?react';

/**
 * Libs
 */
import { cn } from '@/lib/utils';

/**
 * Types
 */
interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const Logo = ({ className, ...props }: LogoProps) => {
  return (
    <LogoIcon
      className={cn('h-10 w-10', className)}
      {...props}
    />
  );
};
