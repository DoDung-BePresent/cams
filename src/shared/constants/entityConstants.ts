import type { SelectProps } from 'antd';
import { EntityStatusEnum } from '@/shared/types/commonTypes';

/**
 * Entity Status Options (used across all features)
 */
export const ENTITY_STATUS_OPTIONS: SelectProps['options'] = [
  { label: 'Active', value: EntityStatusEnum.Active },
  { label: 'Inactive', value: EntityStatusEnum.Inactive },
];

/**
 * Entity Status Labels
 */
export const ENTITY_STATUS_LABELS: Record<EntityStatusEnum, string> = {
  [EntityStatusEnum.Active]: 'Active',
  [EntityStatusEnum.Inactive]: 'Inactive',
};

/**
 * Entity Status Colors (for Tag component)
 */
export const ENTITY_STATUS_COLORS: Record<EntityStatusEnum, string> = {
  [EntityStatusEnum.Active]: 'success',
  [EntityStatusEnum.Inactive]: 'default',
};

/**
 * Common Pagination Sizes
 */
export const PAGINATION_SIZES = [10, 20, 50, 100];

/**
 * Default Page Size
 */
export const DEFAULT_PAGE_SIZE = 10;
