import { api } from '@/config';
import type {
  LoginPayload,
  LoginResponse,
  ProfileResponse,
  RefreshTokenResponse,
  Result,
} from '@/shared/types';

const AUTH_ENDPOINTS = {
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  profile: '/api/auth/profile',
  refreshToken: '/api/auth/refresh-token',
} as const;

export const authService = {
  // POST /api/auth/login
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>(AUTH_ENDPOINTS.login, payload),

  // POST /api/auth/logout
  logout: () => api.post<Result>(AUTH_ENDPOINTS.logout),

  // GET /api/auth/profile
  getProfile: () => api.get<ProfileResponse>(AUTH_ENDPOINTS.profile),

  // POST /api/auth/refresh-token
  refreshToken: () =>
    api.post<RefreshTokenResponse>(AUTH_ENDPOINTS.refreshToken),
};
