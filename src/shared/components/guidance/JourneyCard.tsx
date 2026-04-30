import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Button, Typography } from 'antd';
import { ArrowRightOutlined, CheckOutlined } from '@ant-design/icons';
import { twMerge } from 'tailwind-merge';

const { Title, Paragraph } = Typography;

export type JourneyStep = {
  /** Unique key. */
  key: string;
  /** Short verb-style label ("Create store", "Add music"…). */
  label: ReactNode;
  /** Icon node (emoji, Ant icon, img). */
  icon: ReactNode;
  /** Where the step lands. */
  to?: string;
  /** Optional hover tooltip. */
  hint?: string;
  /** Mark as already completed (renders a green check). */
  done?: boolean;
};

type JourneyCardProps = {
  /** Short title, e.g. "Set up your brand". */
  title: ReactNode;
  /** One-line description of what this flow does. */
  description?: ReactNode;
  /** The ordered journey steps. */
  steps: JourneyStep[];
  /** Which step to visually highlight as the user's "next". */
  currentStepKey?: string;
  /** Optional primary action pinned to the card's header-right. */
  action?: {
    label: ReactNode;
    to?: string;
    href?: string;
    onClick?: () => void;
  };
  /** Optional soft-coloured theme. */
  tone?: 'indigo' | 'amber' | 'sky';
  className?: string;
};

const toneBackground: Record<NonNullable<JourneyCardProps['tone']>, string> = {
  indigo: 'var(--gradient-soft-indigo)',
  amber: 'var(--gradient-soft-amber)',
  sky: 'var(--gradient-soft-sky)',
};

/**
 * JourneyCard
 *
 * A horizontal "flow" card — the UI equivalent of the retail flow diagrams
 * shared by the product team. Each step is an icon tile above a short label,
 * with chevrons in between, so a non-technical operator can see the whole
 * journey at a glance and click straight into the step they need.
 */
export const JourneyCard = ({
  title,
  description,
  steps,
  currentStepKey,
  action,
  tone = 'indigo',
  className,
}: JourneyCardProps) => {
  return (
    <section
      className={twMerge('cams-surface-card overflow-hidden', className)}
      style={{ background: toneBackground[tone] }}
    >
      <div className='flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6'>
        <div className='max-w-xl'>
          <Title
            level={4}
            style={{ marginBottom: 2 }}
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
        {action && <JourneyAction {...action} />}
      </div>

      <div className='overflow-x-auto px-4 py-5 sm:px-6 sm:py-6'>
        <div className='flex min-w-max items-stretch gap-2'>
          {steps.map((step, index) => (
            <div
              key={step.key}
              className='flex items-center gap-2'
            >
              <StepTile
                step={step}
                isCurrent={currentStepKey === step.key}
              />
              {index < steps.length - 1 && (
                <span
                  className='cams-journey-arrow'
                  aria-hidden='true'
                >
                  <ArrowRightOutlined />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const StepTile = ({
  step,
  isCurrent,
}: {
  step: JourneyStep;
  isCurrent: boolean;
}) => {
  const className = twMerge(
    'cams-journey-step',
    step.done && 'cams-journey-step--done',
    isCurrent && !step.done && 'cams-journey-step--current',
  );

  const content = (
    <>
      <span
        className='cams-journey-step__icon'
        aria-hidden='true'
      >
        {step.done ? <CheckOutlined /> : step.icon}
      </span>
      <span className='cams-journey-step__label'>{step.label}</span>
    </>
  );

  if (step.to) {
    return (
      <Link
        to={step.to}
        title={step.hint}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      title={step.hint}
      className={className}
    >
      {content}
    </div>
  );
};

const JourneyAction = ({
  label,
  to,
  href,
  onClick,
}: NonNullable<JourneyCardProps['action']>) => {
  if (to) {
    return (
      <Link to={to}>
        <Button type='primary'>{label}</Button>
      </Link>
    );
  }
  return (
    <Button
      type='primary'
      href={href}
      onClick={onClick}
    >
      {label}
    </Button>
  );
};
