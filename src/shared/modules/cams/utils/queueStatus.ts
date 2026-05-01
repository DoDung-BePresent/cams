import { QueueItemStatus } from '../types';

const QUEUE_STATUS_VALUES = new Set<number>([
  QueueItemStatus.Pending,
  QueueItemStatus.Playing,
  QueueItemStatus.Played,
  QueueItemStatus.Skipped,
]);

export const isCamsQueueItemStatus = (
  value: unknown,
): value is QueueItemStatus =>
  typeof value === 'number' && QUEUE_STATUS_VALUES.has(value);

export const normalizeCamsQueueStatus = (
  value: unknown,
  fallback: QueueItemStatus = QueueItemStatus.Pending,
): QueueItemStatus => (isCamsQueueItemStatus(value) ? value : fallback);

export const getCamsQueueStatusLabel = (status: QueueItemStatus) => {
  switch (status) {
    case QueueItemStatus.Pending:
      return 'Pending';
    case QueueItemStatus.Playing:
      return 'Playing';
    case QueueItemStatus.Played:
      return 'Played';
    case QueueItemStatus.Skipped:
      return 'Skipped';
    default:
      return 'Unknown';
  }
};

export const getCamsQueueStatusDescription = (status: QueueItemStatus) => {
  switch (status) {
    case QueueItemStatus.Pending:
      return 'Up Next';
    case QueueItemStatus.Playing:
      return 'Playing Now';
    case QueueItemStatus.Played:
      return 'Played';
    case QueueItemStatus.Skipped:
      return 'Skipped';
    default:
      return 'Unknown';
  }
};

export const getCamsQueueStatusAntColor = (status: QueueItemStatus) => {
  switch (status) {
    case QueueItemStatus.Pending:
      return 'processing';
    case QueueItemStatus.Playing:
      return 'success';
    case QueueItemStatus.Played:
      return 'default';
    case QueueItemStatus.Skipped:
      return 'error';
    default:
      return 'default';
  }
};

export const getCamsQueueStatusTone = (status: QueueItemStatus) => {
  switch (status) {
    case QueueItemStatus.Pending:
      return {
        color: '#60a5fa',
        bg: 'rgba(96,165,250,0.12)',
        border: 'rgba(96,165,250,0.38)',
      };
    case QueueItemStatus.Playing:
      return {
        color: '#10b981',
        bg: 'rgba(16,185,129,0.14)',
        border: 'rgba(16,185,129,0.42)',
      };
    case QueueItemStatus.Played:
      return {
        color: '#9ca3af',
        bg: 'rgba(156,163,175,0.08)',
        border: 'rgba(156,163,175,0.22)',
      };
    case QueueItemStatus.Skipped:
      return {
        color: '#f87171',
        bg: 'rgba(248,113,113,0.12)',
        border: 'rgba(248,113,113,0.36)',
      };
    default:
      return {
        color: '#9ca3af',
        bg: 'rgba(156,163,175,0.08)',
        border: 'rgba(156,163,175,0.22)',
      };
  }
};

export const canPlayCamsQueueItem = (status: QueueItemStatus) =>
  status !== QueueItemStatus.Playing;

export const canReorderCamsQueueItem = (status: QueueItemStatus) =>
  status === QueueItemStatus.Pending;
