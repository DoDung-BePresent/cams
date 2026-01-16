/**
 * Components
 */
import { Logo } from '@/components/common/logo';

/**
 * Libs
 */
import { cn } from '@/lib/utils';
import { NavLink } from 'react-router';

/**
 * Types
 */
type INavLink = {
  label: string;
  to: string;
};

type HeaderProps = {
  className?: string;
};

export const Header = ({ className }: HeaderProps) => {
  return (
    <header
      className={cn(
        'border-primary bg-background mx-auto flex max-w-6xl items-center justify-between border p-3',
        className,
      )}
    >
      <Logo />
      <NavBar className='px-5' />
    </header>
  );
};

const navLinks: INavLink[] = [
  {
    label: 'Home',
    to: '#',
  },
  {
    label: 'Services',
    to: '#',
  },
  {
    label: 'About Us',
    to: '#',
  },
];

const NavBar = ({ className }: { className?: string }) => {
  return (
    <nav className={cn('', className)}>
      <div className='flex items-center gap-4'>
        {navLinks.map(({ label, to }) => (
          <NavLink
            key={label}
            to={to}
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
