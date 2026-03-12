/**
 * Types
 */
import type { DefaultOptionType } from 'antd/es/select';
import { EntityStatusEnum, RoleEnum } from '@/shared/types/commonTypes';

export const ROLE_OPTIONS_FOR_ADMIN: DefaultOptionType[] = [
  { label: 'Brand Manager', value: RoleEnum.BrandManager },
] as const;

export const ROLE_LABELS = {
  [RoleEnum.SystemAdmin]: 'System Admin',
  [RoleEnum.BrandManager]: 'Brand Manager',
  [RoleEnum.StoreManager]: 'Store Manager',
} as const;

export const ROLE_COLORS = {
  [RoleEnum.SystemAdmin]: 'red',
  [RoleEnum.BrandManager]: 'purple',
  [RoleEnum.StoreManager]: 'blue',
} as const;

export const ACCOUNT_STATUS_COLORS = {
  [EntityStatusEnum.Inactive]: 'default',
  [EntityStatusEnum.Active]: 'success',
  [EntityStatusEnum.Pending]: 'processing',
  [EntityStatusEnum.Rejected]: 'error',
} as const;

export const ACCOUNT_STATUS_LABELS = {
  [EntityStatusEnum.Inactive]: 'Inactive',
  [EntityStatusEnum.Active]: 'Active',
  [EntityStatusEnum.Pending]: 'Pending',
  [EntityStatusEnum.Rejected]: 'Rejected',
} as const;