import { EntityStatusEnum } from '@/shared/types/commonTypes';

export const STORE_STATUS_COLORS = {
  [EntityStatusEnum.Inactive]: 'default',
  [EntityStatusEnum.Active]: 'success',
  [EntityStatusEnum.Pending]: 'processing',
  [EntityStatusEnum.Rejected]: 'error',
} as const;

export const STORE_STATUS_LABELS = {
  [EntityStatusEnum.Inactive]: 'Inactive',
  [EntityStatusEnum.Active]: 'Active',
  [EntityStatusEnum.Pending]: 'Pending',
  [EntityStatusEnum.Rejected]: 'Rejected',
} as const;
