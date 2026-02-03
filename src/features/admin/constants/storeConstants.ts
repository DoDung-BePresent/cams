import type { DefaultOptionType } from 'antd/es/select';

export const BUSINESS_TYPES: DefaultOptionType[] = [
  { label: 'Cafe', value: 'cafe' },
  { label: 'Retail', value: 'retail' },
  { label: 'Restaurant', value: 'restaurant' },
  { label: 'Other', value: 'other' },
] as const;
