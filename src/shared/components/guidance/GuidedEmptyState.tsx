import type { ReactNode } from 'react';
import { Button, Typography } from 'antd';
import { twMerge } from 'tailwind-merge';

const { Title, Paragraph } = Typography;

type GuidedEmptyStateProps = {
  /** Optional icon shown above the title. */
  icon?: ReactNode;
  /** Short, warm headline. One line. */
  title: ReactNode;
  /** One sentence of plain-language context. */
  description?: ReactNode;
  /** Optional primary CTA. */
  primaryAction?: {
    label: ReactNode;
    onClick?: () => void;
    href?: string;
    icon?: ReactNode;
  };
  /** Optional quiet secondary link. */
  secondaryAction?: {
    label: ReactNode;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
};

/**
 * GuidedEmptyState
 *
 * A calm, friendly placeholder for empty lists, tables and panels. One icon,
 * one sentence, one (optional) action — no numbered instructions, no tutorial
 * overlays. The goal is to make "nothing here yet" feel gentle and obvious.
 */
export const GuidedEmptyState = ({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: GuidedEmptyStateProps) => {
  return (
    <div
      className={twMerge(
        'flex w-full flex-col items-center gap-3 px-6 py-10 text-center',
        className,
      )}
    >
      {icon && (
        <div className='text-3xl text-[color:var(--color-accent-indigo)]'>
          {icon}
        </div>
      )}

      <div className='max-w-md'>
        <Title
          level={5}
          style={{ marginBottom: description ? 4 : 0 }}
        >
          {title}
        </Title>
        {description && (
          <Paragraph
            type='secondary'
            style={{ marginBottom: 0 }}
          >
            {description}
          </Paragraph>
        )}
      </div>

      {(primaryAction || secondaryAction) && (
        <div className='mt-2 flex flex-wrap items-center gap-2'>
          {primaryAction && (
            <Button
              type='primary'
              icon={primaryAction.icon}
              href={primaryAction.href}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              type='link'
              href={secondaryAction.href}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
