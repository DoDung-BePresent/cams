export const ROLES = {
  SYSTEM_ADMIN: 'SystemAdmin',
  STORE_MANAGER: 'StoreManager',
  BRAND_MANAGER: 'BrandManager',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_ENUM_MAP: Record<number, UserRole> = {
  0: ROLES.SYSTEM_ADMIN,
  1: ROLES.BRAND_MANAGER,
  2: ROLES.STORE_MANAGER,
};
