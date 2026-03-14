import { RoleEnum } from '../types';

/**
 * Role Display Labels
 */
export const ROLE_LABELS: Record<RoleEnum, string> = {
  [RoleEnum.SystemAdmin]: 'System Administrator',
  [RoleEnum.BrandManager]: 'Brand Manager',
  [RoleEnum.StoreManager]: 'Store Manager',
};
