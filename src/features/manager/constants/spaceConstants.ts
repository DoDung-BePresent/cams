import type { DefaultOptionType } from 'antd/es/select';

export const SPACE_STATUS: DefaultOptionType[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
] as const;

export const DEVICE_STATUS_COLORS = {
  connected: 'success',
  disconnected: 'error',
} as const;

export const DEVICE_STATUS_LABELS = {
  connected: 'Connected',
  disconnected: 'Disconnected',
} as const;
