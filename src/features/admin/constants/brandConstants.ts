/**
 * Types
 */
import type { DefaultOptionType } from 'antd/es/select';
import { EntityStatusEnum } from '@/shared/types';

export const INDUSTRY_OPTIONS: DefaultOptionType[] = [
  { label: 'F&B', value: 'F&B' },
  { label: 'Retail', value: 'Retail' },
  { label: 'Hospitality', value: 'Hospitality' },
  { label: 'Healthcare', value: 'Healthcare' },
  { label: 'Education', value: 'Education' },
  { label: 'Entertainment', value: 'Entertainment' },
  { label: 'Technology', value: 'Technology' },
  { label: 'Other', value: 'Other' },
] as const;

export const TIMEZONE_OPTIONS: DefaultOptionType[] = [
  { label: 'SE Asia (UTC+7)', value: 'SE Asia Standard Time' },
  { label: 'Singapore (UTC+8)', value: 'Singapore Standard Time' },
  { label: 'China (UTC+8)', value: 'China Standard Time' },
  { label: 'Tokyo (UTC+9)', value: 'Tokyo Standard Time' },
  { label: 'India (UTC+5:30)', value: 'India Standard Time' },
  { label: 'UTC (UTC+0)', value: 'UTC' },
  { label: 'Pacific (UTC-8)', value: 'Pacific Standard Time' },
] as const;

export const BRAND_STATUS_COLORS = {
  [EntityStatusEnum.Active]: 'success',
  [EntityStatusEnum.Inactive]: 'default',
  [EntityStatusEnum.Pending]: 'processing',
  [EntityStatusEnum.Rejected]: 'error',
} as const;

export const BRAND_STATUS_LABELS = {
  [EntityStatusEnum.Active]: 'Active',
  [EntityStatusEnum.Inactive]: 'Inactive',
  [EntityStatusEnum.Pending]: 'Pending',
  [EntityStatusEnum.Rejected]: 'Rejected',
} as const;
