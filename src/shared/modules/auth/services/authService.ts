import { api } from '@/config';

/**
 * Types
 */
import type {
  LoginPayload,
  LoginResponse,
  ProfileResponse,
  RefreshTokenResponse,
  ChangePasswordRequest,
  ForgotPasswordOtpResponse,
  ForgotPasswordRequest,
  ResetForgotPasswordRequest,
  VerifyForgotPasswordOtpRequest,
  VerifyForgotPasswordOtpResponse,
} from '../types';
import type { Result } from '@/shared/types';

const AUTH_ENDPOINTS = {
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  profile: '/api/auth/profile',
  refreshToken: '/api/auth/refresh-token',
  changePassword: '/api/auth/change-password',
  forgotPassword: '/api/auth/forgot-password',
  verifyForgotPasswordOtp: '/api/auth/forgot-password/verify-otp',
  resetForgotPassword: '/api/auth/forgot-password/reset',
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

  // POST /api/auth/change-password
  changePassword: (data: ChangePasswordRequest) =>
    api.post<Result>(AUTH_ENDPOINTS.changePassword, data),

  // POST /api/auth/forgot-password
  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post<ForgotPasswordOtpResponse>(AUTH_ENDPOINTS.forgotPassword, data),

  // POST /api/auth/forgot-password/verify-otp
  verifyForgotPasswordOtp: (data: VerifyForgotPasswordOtpRequest) =>
    api.post<VerifyForgotPasswordOtpResponse>(
      AUTH_ENDPOINTS.verifyForgotPasswordOtp,
      data,
    ),

  // POST /api/auth/forgot-password/reset
  resetForgotPassword: (data: ResetForgotPasswordRequest) =>
    api.post<Result>(AUTH_ENDPOINTS.resetForgotPassword, data),
};
