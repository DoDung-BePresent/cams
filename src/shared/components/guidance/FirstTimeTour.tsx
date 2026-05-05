import { useEffect, useState } from 'react';
import { Tour } from 'antd';
import type { TourProps } from 'antd';

type FirstTimeTourProps = {
  /** Stable id used to remember that the user has seen the tour. */
  storageKey: string;
  steps: TourProps['steps'];
  /**
   * If true, the tour opens automatically on first mount for the current
   * browser (based on `localStorage[storageKey]`).
   */
  autoStart?: boolean;
  /** External trigger, e.g. when the user clicks a "Show me around" button. */
  open?: boolean;
  onClose?: () => void;
};

/**
 * FirstTimeTour
 *
 * Thin wrapper around Ant Design's `Tour` that:
 *   - remembers per-browser whether the tour has been dismissed, so guests are
 *     only walked through the first time,
 *   - accepts an external `open` prop so a "Show me around" button anywhere in
 *     the page can replay the tour on demand.
 *
 * Keep the `steps` list short (3–5) — this is orientation, not documentation.
 */
export const FirstTimeTour = ({
  storageKey,
  steps,
  autoStart = true,
  open,
  onClose,
}: FirstTimeTourProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  useEffect(() => {
    if (!autoStart) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const seen =
        typeof window !== 'undefined' &&
        window.localStorage?.getItem(storageKey) === '1';
      if (!seen) {
        timer = setTimeout(() => setInternalOpen(true), 0);
      }
    } catch {
      /* storage might be disabled — fall back to never auto-starting */
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autoStart, storageKey]);

  const isOpen = open ?? internalOpen;

  const handleClose = () => {
    try {
      window.localStorage?.setItem(storageKey, '1');
    } catch {
      /* ignore */
    }
    setInternalOpen(false);
    onClose?.();
  };

  return (
    <Tour
      open={isOpen}
      onClose={handleClose}
      steps={steps}
    />
  );
};
