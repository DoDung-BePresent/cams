import type { ReactNode } from 'react';
import { Button, Typography } from 'antd';
import { twMerge } from 'tailwind-merge';

const { Title, Paragraph } = Typography;

type InstructionalHeroProps = {
  /** Small eyebrow tag above the title, e.g. "Welcome back" or "Admin workspace". */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** One-to-two sentence subtitle that explains what the workspace is for. */
  description?: ReactNode;
  /** Bullet highlights – usually 2-4 capabilities the user can explore. */
  highlights?: Array<{
    icon?: ReactNode;
    label: ReactNode;
    /** Short sentence after the bold label. */
    description?: ReactNode;
  }>;
  primaryAction?: {
    label: ReactNode;
    onClick?: () => void;
    href?: string;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: ReactNode;
    onClick?: () => void;
    href?: string;
  };
  /** Pick a built-in gradient or pass a custom CSS background. */
  theme?: 'indigo' | 'amber' | 'emerald';
  illustration?: ReactNode;
  className?: string;
};

const themeToGradient: Record<
  NonNullable<InstructionalHeroProps['theme']>,
  string
> = {
  indigo: 'var(--gradient-hero-indigo)',
  amber: 'var(--gradient-hero-amber)',
  emerald: 'var(--gradient-hero-emerald)',
};

/**
 * InstructionalHero
 *
 * The new role-aware hero that replaces the static WelcomeBanner. It makes
 * every dashboard explain:
 *   1. where the user is ("Brand workspace")
 *   2. what they can do here (highlights)
 *   3. what to do first (primary + secondary CTA)
 *
 * Designed for guest-friendly first impressions but safe to show to returning
 * users too — the highlights act as a constant reminder of the feature set.
 */
export const InstructionalHero = ({
  eyebrow,
  title,
  description,
  highlights,
  primaryAction,
  secondaryAction,
  theme = 'indigo',
  illustration,
  className,
}: InstructionalHeroProps) => {
  return (
    <section
      className={twMerge(
        'relative overflow-hidden rounded-2xl p-6 text-white sm:p-8',
        className,
      )}
      style={{ background: themeToGradient[theme] }}
      aria-labelledby='cams-hero-title'
    >
      <div className='relative z-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)] md:items-center'>
        <div className='flex flex-col gap-4'>
          {eyebrow && (
            <span className='w-fit rounded-full bg-white/18 px-3 py-1 text-[11px] font-medium tracking-wide text-white uppercase backdrop-blur-sm'>
              {eyebrow}
            </span>
          )}
          <Title
            id='cams-hero-title'
            level={2}
            style={{ color: '#fff', marginBottom: 0 }}
          >
            {title}
          </Title>
          {description && (
            <Paragraph
              style={{ color: 'rgba(255,255,255,0.92)', marginBottom: 0 }}
            >
              {description}
            </Paragraph>
          )}

          {highlights && highlights.length > 0 && (
            <ul className='mt-1 grid gap-3 sm:grid-cols-2'>
              {highlights.map((item, index) => (
                <li
                  key={index}
                  className='flex items-start gap-3 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm'
                >
                  {item.icon && (
                    <span className='mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-white'>
                      {item.icon}
                    </span>
                  )}
                  <div>
                    <div className='text-sm font-semibold text-white'>
                      {item.label}
                    </div>
                    {item.description && (
                      <div className='text-xs leading-relaxed text-white/85'>
                        {item.description}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {(primaryAction || secondaryAction) && (
            <div className='mt-2 flex flex-wrap items-center gap-3'>
              {primaryAction && (
                <Button
                  size='large'
                  icon={primaryAction.icon}
                  href={primaryAction.href}
                  onClick={primaryAction.onClick}
                  className='border-0! bg-white! text-[color:var(--color-accent-indigo)]! hover:bg-white/90!'
                >
                  {primaryAction.label}
                </Button>
              )}
              {secondaryAction && (
                <Button
                  size='large'
                  type='text'
                  href={secondaryAction.href}
                  onClick={secondaryAction.onClick}
                  className='text-white! hover:bg-white/15!'
                >
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>

        {illustration && (
          <div className='hidden justify-end md:flex'>
            <div className='relative flex max-w-xs items-center justify-center drop-shadow-xl'>
              {illustration}
            </div>
          </div>
        )}
      </div>

      <div
        aria-hidden='true'
        className='pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/20 blur-3xl'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -bottom-14 -left-10 h-56 w-56 rounded-full bg-black/10 blur-3xl'
      />
    </section>
  );
};
