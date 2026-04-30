import type { ReactNode } from 'react';
import { Button, Progress, Typography } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { twMerge } from 'tailwind-merge';

const { Title, Text, Paragraph } = Typography;

export type OnboardingChecklistItem = {
  /** Stable id so we can remember dismissed / completed state later. */
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Whether the task is done. */
  done?: boolean;
  /**
   * CTA the user can click to start the task. Not shown when `done` is true.
   */
  action?: {
    label: ReactNode;
    onClick?: () => void;
    href?: string;
  };
};

type OnboardingChecklistProps = {
  title?: ReactNode;
  description?: ReactNode;
  items: OnboardingChecklistItem[];
  /** Optional footer, e.g. "Need help? Contact support". */
  footer?: ReactNode;
  className?: string;
};

/**
 * OnboardingChecklist
 *
 * Lightweight "Getting started" card. Shows a progress bar of completed steps
 * and a short actionable to-do for each remaining step. Pure presentational —
 * the parent decides what counts as "done" (often by checking whether the
 * relevant entity already exists for the user).
 */
export const OnboardingChecklist = ({
  title = 'Getting started',
  description,
  items,
  footer,
  className,
}: OnboardingChecklistProps) => {
  const doneCount = items.filter((item) => item.done).length;
  const total = items.length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  return (
    <section
      className={twMerge(
        'cams-surface-card flex flex-col gap-5 p-5 sm:p-6',
        className,
      )}
      aria-labelledby='onboarding-checklist-title'
    >
      <header className='flex flex-col gap-2'>
        <div className='flex items-baseline justify-between gap-3'>
          <Title
            id='onboarding-checklist-title'
            level={5}
            style={{ marginBottom: 0 }}
          >
            {title}
          </Title>
          <Text type='secondary'>
            {doneCount} of {total} done
          </Text>
        </div>
        {description && (
          <Paragraph
            type='secondary'
            style={{ marginBottom: 0 }}
          >
            {description}
          </Paragraph>
        )}
        <Progress
          percent={percent}
          showInfo={false}
          strokeColor='var(--color-accent-indigo)'
          size='small'
        />
      </header>

      <ol className='flex flex-col gap-3'>
        {items.map((item, index) => (
          <li
            key={item.id}
            className='flex items-start gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-[color:var(--color-border-subtle)] hover:bg-[color:var(--color-surface-muted)]'
          >
            {item.done ? (
              <CheckCircleFilled
                className='mt-1 text-[color:var(--color-accent-emerald)]'
                aria-label='Completed'
              />
            ) : (
              <span
                className='cams-step-number mt-0.5'
                aria-hidden='true'
              >
                {index + 1}
              </span>
            )}
            <div className='flex flex-1 flex-col gap-1'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <span
                  className={twMerge(
                    'font-medium',
                    item.done
                      ? 'text-[color:var(--color-text-subtle)] line-through'
                      : 'text-[color:var(--color-text-strong)]',
                  )}
                >
                  {item.title}
                </span>
                {!item.done && item.action && (
                  <Button
                    type='link'
                    size='small'
                    href={item.action.href}
                    onClick={item.action.onClick}
                    style={{ paddingInline: 0 }}
                  >
                    {item.action.label}
                  </Button>
                )}
              </div>
              {item.description && (
                <Text
                  type='secondary'
                  style={{ fontSize: 13 }}
                >
                  {item.description}
                </Text>
              )}
            </div>
          </li>
        ))}
      </ol>

      {footer && (
        <footer className='border-t border-[color:var(--color-border-subtle)] pt-4 text-sm text-[color:var(--color-text-subtle)]'>
          {footer}
        </footer>
      )}
    </section>
  );
};
