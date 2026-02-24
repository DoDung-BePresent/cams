export const ROLES = {
  SYSTEM_ADMIN: 'SystemAdmin',
  STORE_MANAGER: 'StoreManager',
  BRANCH_MANAGER: 'BranchManager',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_ENUM_MAP: Record<number, UserRole> = {
  0: ROLES.SYSTEM_ADMIN,
  1: ROLES.STORE_MANAGER,
  2: ROLES.BRANCH_MANAGER,
};
