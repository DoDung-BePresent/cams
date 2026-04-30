import type { ReactNode } from 'react';
import { Typography } from 'antd';
import { BookOutlined, MailOutlined, MessageOutlined } from '@ant-design/icons';
import { twMerge } from 'tailwind-merge';

const { Text } = Typography;

type SupportFooterProps = {
  /** Short, friendly intro. Defaults to a helpful welcome sentence. */
  message?: ReactNode;
  /** Docs / user guide URL. */
  docsHref?: string;
  /** Support email. */
  supportEmail?: string;
  /** Support chat / ticket link. */
  chatHref?: string;
  className?: string;
};

/**
 * SupportFooter
 *
 * Compact "we've got your back" bar that sits at the bottom of dashboards and
 * first-time empty states. Makes the system feel less intimidating to users
 * who have never seen it before by giving them an obvious next step when they
 * get stuck.
 */
export const SupportFooter = ({
  message = "New to LogAICAMS? We're happy to help you get set up.",
  docsHref = 'https://logaicams.com/docs',
  supportEmail = 'support@logaicams.com',
  chatHref,
  className,
}: SupportFooterProps) => {
  return (
    <div
      className={twMerge(
        'cams-surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5',
        className,
      )}
    >
      <div className='flex items-center gap-3'>
        <span className='flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-primary-soft)] text-[color:var(--color-accent-indigo)]'>
          <MessageOutlined />
        </span>
        <Text className='text-sm text-[color:var(--color-text-subtle)]'>
          {message}
        </Text>
      </div>
      <div className='flex flex-wrap items-center gap-4 text-sm'>
        <a
          href={docsHref}
          target='_blank'
          rel='noreferrer'
          className='inline-flex items-center gap-1.5 font-medium text-[color:var(--color-accent-indigo)] hover:underline'
        >
          <BookOutlined />
          User guide
        </a>
        {chatHref && (
          <a
            href={chatHref}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1.5 font-medium text-[color:var(--color-accent-indigo)] hover:underline'
          >
            <MessageOutlined />
            Live chat
          </a>
        )}
        <a
          href={`mailto:${supportEmail}`}
          className='inline-flex items-center gap-1.5 font-medium text-[color:var(--color-accent-indigo)] hover:underline'
        >
          <MailOutlined />
          {supportEmail}
        </a>
      </div>
    </div>
  );
};
