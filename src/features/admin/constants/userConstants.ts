import type { DefaultOptionType } from 'antd/es/select';

export const USER_ROLES: DefaultOptionType[] = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Store Manager', value: 'STORE_MANAGER' },
  { label: 'Branch Manager', value: 'BRANCH_MANAGER' },
] as const;

export const USER_STATUS_COLORS = {
  INVITED: 'warning',
  ACTIVE: 'success',
  SUSPENDED: 'error',
} as const;

export const USER_STATUS_LABELS = {
  INVITED: 'Invited',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
} as const;
