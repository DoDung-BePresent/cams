import type { SelectProps } from 'antd';
import { SpaceTypeEnum } from '../types';

/**
 * Space Type Options for Select Dropdown
 */
export const SPACE_TYPE_OPTIONS: SelectProps['options'] = [
  { label: 'Counter', value: SpaceTypeEnum.Counter },
  { label: 'Hall', value: SpaceTypeEnum.Hall },
  { label: 'Entrance', value: SpaceTypeEnum.Entrance },
  { label: 'Outdoor', value: SpaceTypeEnum.Outdoor },
  { label: 'Kitchen', value: SpaceTypeEnum.Kitchen },
  { label: 'Restroom', value: SpaceTypeEnum.Restroom },
];

/**
 * Space Type Labels (for display)
 */
export const SPACE_TYPE_LABELS: Record<SpaceTypeEnum, string> = {
  [SpaceTypeEnum.Counter]: 'Counter',
  [SpaceTypeEnum.Hall]: 'Hall',
  [SpaceTypeEnum.Entrance]: 'Entrance',
  [SpaceTypeEnum.Outdoor]: 'Outdoor',
  [SpaceTypeEnum.Kitchen]: 'Kitchen',
  [SpaceTypeEnum.Restroom]: 'Restroom',
};

/**
 * Space Type Colors (for Tag/Badge)
 */
export const SPACE_TYPE_COLORS: Record<SpaceTypeEnum, string> = {
  [SpaceTypeEnum.Counter]: 'blue',
  [SpaceTypeEnum.Hall]: 'green',
  [SpaceTypeEnum.Entrance]: 'orange',
  [SpaceTypeEnum.Outdoor]: 'cyan',
  [SpaceTypeEnum.Kitchen]: 'volcano',
  [SpaceTypeEnum.Restroom]: 'purple',
};

/**
 * API Endpoints
 */
export const SPACE_ENDPOINTS = {
  list: '/api/spaces',
  detail: (id: string) => `/api/spaces/${id}`,
  create: '/api/spaces',
  update: (id: string) => `/api/spaces/${id}`,
  delete: (id: string) => `/api/spaces/${id}`,
  toggleStatus: (id: string) => `/api/spaces/${id}/toggle-status`,
} as const;
