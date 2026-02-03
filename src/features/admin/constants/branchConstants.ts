import type { DefaultOptionType } from 'antd/es/select';

export const BRANCH_STATUS: DefaultOptionType[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
] as const;
