import { Tag, Typography } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { cn } from '@/shared/lib';

const { Text } = Typography;

export type ModelPickerOption<T extends string | number> = {
  value: T;
  /** Short model name shown as the title. */
  title: string;
  /** One-line description of when to pick this model. */
  description: string;
  /** Pricing badge — e.g. `"Free"` or `"3 coins"`. */
  price: string;
  /** Price tone — colors the badge. */
  priceTone?: 'free' | 'paid';
  /** Optional small footnote under description — e.g. "~1–2 min per track". */
  footnote?: string;
  /** Optional leading icon. */
  icon?: React.ReactNode;
  /** Disable the option with a hint. */
  disabled?: boolean;
  /** Optional extra content rendered when selected (badge row, capacity, etc.). */
  trailing?: React.ReactNode;
};

type ModelPickerCardProps<T extends string | number> = {
  options: ModelPickerOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Compact spacing — useful inside drawers. */
  compact?: boolean;
};

/**
 * Radio-style card picker for choosing an AI model / plan / variant.
 *
 * Renders as side-by-side tiles. The selected tile gets the primary border
 * + check icon. Each option shows a pricing badge (Free / N coins).
 */
export const ModelPickerCard = <T extends string | number>({
  options,
  value,
  onChange,
  compact = false,
}: ModelPickerCardProps<T>) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 sm:grid-cols-2',
        compact && 'gap-2',
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const tone = option.priceTone ?? 'paid';

        return (
          <button
            type='button'
            key={String(option.value)}
            onClick={() => !option.disabled && onChange(option.value)}
            disabled={option.disabled}
            className={cn(
              'group relative flex flex-col gap-2 rounded-[14px] border p-4 text-left transition-all',
              'focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
              selected
                ? 'border-[var(--ant-color-primary)] bg-[var(--color-primary-softer,rgba(79,70,229,0.06))] shadow-sm'
                : 'border-[var(--color-border-subtle,#EAECF0)] bg-white hover:border-[var(--ant-color-primary)]/60 hover:shadow-sm',
              option.disabled && 'cursor-not-allowed opacity-60',
              compact && 'p-3',
            )}
            aria-pressed={selected}
          >
            {/* Selected check */}
            {selected && (
              <CheckCircleFilled
                className='absolute top-3 right-3 text-[18px]'
                style={{ color: 'var(--ant-color-primary)' }}
              />
            )}

            {/* Header row: icon + title + price */}
            <div className='flex items-start gap-3'>
              {option.icon && (
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-[18px]',
                    selected
                      ? 'bg-[var(--ant-color-primary)] text-white'
                      : 'bg-[var(--color-surface-soft,#F4F6FA)] text-[var(--ant-color-text-secondary)]',
                  )}
                >
                  {option.icon}
                </div>
              )}
              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <Text
                    strong
                    style={{ fontSize: 15 }}
                  >
                    {option.title}
                  </Text>
                </div>
                <Text
                  type='secondary'
                  style={{ fontSize: 13, lineHeight: 1.5 }}
                >
                  {option.description}
                </Text>
              </div>
            </div>

            {/* Price + footnote row */}
            <div className='flex items-center justify-between pl-[52px]'>
              <Tag
                color={tone === 'free' ? 'green' : 'gold'}
                style={{
                  margin: 0,
                  borderRadius: 999,
                  fontWeight: 600,
                  padding: '0 10px',
                  lineHeight: '22px',
                }}
              >
                {option.price}
              </Tag>
              {option.footnote && (
                <Text
                  type='secondary'
                  style={{ fontSize: 12 }}
                >
                  {option.footnote}
                </Text>
              )}
            </div>

            {option.trailing && (
              <div className='pl-[52px]'>{option.trailing}</div>
            )}
          </button>
        );
      })}
    </div>
  );
};
