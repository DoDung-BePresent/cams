import { api } from '@/config';

/**
 * Types
 */
import type { Result, UserDetail } from '@/shared/types';

const USER_ENDPOINTS = {
  detail: (id: string) => `/api/users/${id}`,
} as const;

/**
 * Shared user service for cross-feature user data access
 * For full CRUD operations, use feature-specific services (admin/accountService, brand/staffService)
 */
export const userService = {
  // GET /api/users/{id}
  getById: (id: string) =>
    api.get<Result<UserDetail>>(USER_ENDPOINTS.detail(id)),
};
