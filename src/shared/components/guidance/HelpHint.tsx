import { Popover, Tooltip, Typography } from 'antd';
import { InfoCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

const { Text, Paragraph } = Typography;

type HelpHintBaseProps = {
  /** Short label used as the popover / tooltip title. */
  title?: ReactNode;
  /** Rich help content. Can be a string, bullet list, or any node. */
  content: ReactNode;
  /** Iconography flavour. */
  variant?: 'info' | 'question';
  /** Accent colour of the trigger icon. Defaults to muted grey. */
  tone?: 'muted' | 'primary';
  className?: string;
  /**
   * Wrap an existing element instead of rendering the default icon trigger.
   * Useful for attaching a hint to a form label or a button.
   */
  children?: ReactNode;
  /**
   * Force tooltip (compact) vs popover (rich) rendering.
   * When omitted, tooltip is used for short string content, popover otherwise.
   */
  kind?: 'tooltip' | 'popover';
  placement?:
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight';
};

/**
 * HelpHint
 *
 * A tiny, consistent "(?)" / "(i)" affordance that we sprinkle across the CMS
 * so first-time users can read what a filter, button, or section does before
 * they click it.
 *
 * Pass a `content` string for short hints, or a `<div>` with bullets / links
 * for richer documentation. When `children` are provided the hint wraps them
 * instead of rendering the default trigger icon.
 */
export const HelpHint = ({
  title,
  content,
  variant = 'info',
  tone = 'muted',
  className,
  children,
  kind,
  placement = 'top',
}: HelpHintBaseProps) => {
  const resolvedKind =
    kind ??
    (typeof content === 'string' && content.length < 120
      ? 'tooltip'
      : 'popover');

  const Icon =
    variant === 'question' ? QuestionCircleOutlined : InfoCircleOutlined;
  const iconClass = twMerge(
    'cursor-help transition-colors',
    tone === 'primary'
      ? 'text-[color:var(--color-accent-indigo)] hover:opacity-80'
      : 'text-[color:var(--color-gray-soft)] hover:text-[color:var(--color-accent-indigo)]',
    className,
  );

  const trigger = children ?? (
    <Icon
      className={iconClass}
      aria-label={typeof title === 'string' ? title : 'More information'}
    />
  );

  if (resolvedKind === 'tooltip') {
    return (
      <Tooltip
        title={content}
        placement={placement}
      >
        <span className='inline-flex items-center'>{trigger}</span>
      </Tooltip>
    );
  }

  return (
    <Popover
      placement={placement}
      title={title ? <Text strong>{title}</Text> : undefined}
      content={
        typeof content === 'string' ? (
          <Paragraph style={{ marginBottom: 0, maxWidth: 320 }}>
            {content}
          </Paragraph>
        ) : (
          <div className='max-w-80 text-sm leading-relaxed'>{content}</div>
        )
      }
    >
      <span className='inline-flex items-center'>{trigger}</span>
    </Popover>
  );
};
