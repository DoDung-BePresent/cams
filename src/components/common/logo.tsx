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
  showLabel?: boolean;
}

export const Logo = ({ className, showLabel = false, ...props }: LogoProps) => {
  return (
    <div className='flex items-center gap-3'>
      <LogoIcon
        className={cn('h-10 w-10', className)}
        {...props}
      />
      {showLabel && (
        <span className='text-primary text-3xl font-semibold'>CAMS</span>
      )}
    </div>
  );
};
