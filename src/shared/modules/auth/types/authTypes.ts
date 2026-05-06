import type { Result, RoleEnum } from '@/shared/types';

/**
 * Request Payloads
 */
export type LoginPayload = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type VerifyForgotPasswordOtpRequest = {
  email: string;
  otp: string;
};

export type ResetForgotPasswordRequest = {
  email: string;
  newPassword: string;
  confirmPassword: string;
};

/**
 * Response Data Types (nested in Result<T>)
 */
export type LoginData = {
  accessToken: string;
  expiresAt: string;
  roles: number[];
};

export type ProfileData = {
  email: string;
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  brandId?: string | null;
  storeId?: string | null;
  roles: number[];
};

export type RefreshTokenData = {
  accessToken: string;
  expiresAt: string;
  // refreshToken is in HttpOnly cookie, not in response
};

export type ForgotPasswordOtpData = {
  email: string;
  expiresAtUtc: string;
  expiresInSeconds: number;
  resendAvailableAtUtc: string;
  resendAfterSeconds: number;
  remainingAttempts: number;
  maxAttempts: number;
};

export type VerifyForgotPasswordOtpData = {
  email: string;
  resetSessionExpiresAtUtc: string;
  resetSessionExpiresInSeconds: number;
  remainingAttempts: number;
  maxAttempts: number;
};

/**
 * Response Types (using common Result<T>)
 */
export type LoginResponse = Result<LoginData>;
export type ProfileResponse = Result<ProfileData>;
export type RefreshTokenResponse = Result<RefreshTokenData>;
export type ForgotPasswordOtpResponse = Result<ForgotPasswordOtpData>;
export type VerifyForgotPasswordOtpResponse =
  Result<VerifyForgotPasswordOtpData>;

/**
 * Domain Types
 */
export interface User {
  email: string;
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  roles: RoleEnum[];
  brandId?: string | null;
  storeId?: string | null;
}

/**
 * Context Types
 */
export type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};
