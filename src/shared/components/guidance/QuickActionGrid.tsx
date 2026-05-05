import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { twMerge } from 'tailwind-merge';

const { Title, Text } = Typography;

export type QuickAction = {
  /** Stable key. */
  key: string;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** In-app route. If provided, renders as a react-router `<Link>`. */
  to?: string;
  /** External link. */
  href?: string;
  onClick?: () => void;
  /** Optional accent, e.g. "new", "required". */
  badge?: ReactNode;
};

type QuickActionGridProps = {
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
  className?: string;
};

/**
 * QuickActionGrid
 *
 * Shows a small responsive grid of "what would you like to do next?" cards.
 * Used on dashboards and feature landing pages so new users can jump straight
 * to the next meaningful action without hunting through the sidebar.
 */
export const QuickActionGrid = ({
  actions,
  columns = 3,
  className,
}: QuickActionGridProps) => {
  const gridCols =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div
      className={twMerge('grid grid-cols-1 gap-4', gridCols, className)}
      role='list'
    >
      {actions.map((action) => {
        const body = (
          <div
            className='group flex h-full cursor-pointer flex-col gap-3 rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[color:var(--color-accent-indigo)] hover:shadow-[var(--shadow-lift)]'
            role='listitem'
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--color-primary-soft)] text-xl text-[color:var(--color-accent-indigo)]'>
                {action.icon}
              </div>
              {action.badge && (
                <span className='rounded-full bg-[color:var(--color-primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-accent-indigo)]'>
                  {action.badge}
                </span>
              )}
            </div>
            <div className='flex flex-col gap-1'>
              <Title
                level={5}
                style={{ marginBottom: 0 }}
              >
                {action.title}
              </Title>
              {action.description && (
                <Text type='secondary'>{action.description}</Text>
              )}
            </div>
            <div className='mt-auto flex items-center gap-1 text-sm font-medium text-[color:var(--color-accent-indigo)] opacity-0 transition-opacity group-hover:opacity-100'>
              Open <ArrowRightOutlined />
            </div>
          </div>
        );

        if (action.to) {
          return (
            <Link
              key={action.key}
              to={action.to}
              className='block h-full'
            >
              {body}
            </Link>
          );
        }

        if (action.href) {
          return (
            <a
              key={action.key}
              href={action.href}
              target='_blank'
              rel='noreferrer'
              className='block h-full'
            >
              {body}
            </a>
          );
        }

        return (
          <button
            key={action.key}
            type='button'
            onClick={action.onClick}
            className='block h-full w-full text-left'
          >
            {body}
          </button>
        );
      })}
    </div>
  );
};
