export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
