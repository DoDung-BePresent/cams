import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from './env';
import { ErrorCodeEnum } from '@/shared/types';

const ACCESS_TOKEN_KEY = 'access_token';
let isRefreshing = false;

type RefreshQueueError = AxiosError | Error | null;

type AuthAxiosRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _isRefreshRequest?: boolean;
  skipAuthRefresh?: boolean;
};

let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: RefreshQueueError) => void;
}> = [];

const processQueue = (
  error: RefreshQueueError,
  token: string | null = null,
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const isAuthFailure = (error: unknown): boolean => {
  return axios.isAxiosError(error) && error.response?.status === 401;
};

const isTransientRefreshFailure = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return (
    !error.response ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
};

export const api = axios.create({
  baseURL: env.baseUrl,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'x-ngrok-skip-browser-warning': '1',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor with refresh token logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (!error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as AuthAxiosRequestConfig;

    if (originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    const isRefreshRequest = originalRequest._isRefreshRequest === true;

    // Handle refresh request failure
    if (error.response?.status === 401 && isRefreshRequest) {
      console.error(
        '[Auth] Refresh token request returned 401. Response:',
        error.response?.data,
      );
      console.error(
        '[Auth] This means refresh token cookie was not sent or is invalid/expired.',
      );
      processQueue(error, null);
      clearTokens();
      window.location.href = '/login?session=expired';
      return Promise.reject(error);
    }

    // Skip refresh token retry for auth endpoints
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh-token');

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Skip refresh when 401 is due to invalid credentials (e.g. wrong current password)
    const errorCode = (error.response?.data as Record<string, unknown>)
      ?.errorCode;
    if (
      error.response?.status === 401 &&
      errorCode === ErrorCodeEnum.InvalidCredentials
    ) {
      return Promise.reject(error);
    }

    // Only retry 401 errors once
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return api(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const currentToken = getAccessToken();
      if (!currentToken) {
        throw new Error('No access token available for refresh');
      }

      console.log('[Auth] Starting refresh token request...');
      console.log(
        '[Auth] Current (expired) access token exists:',
        !!currentToken,
      );
      console.log('[Auth] withCredentials: true (cookie should be sent)');

      const response = await api.post('/api/auth/refresh-token', {}, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
        withCredentials: true,
        _isRefreshRequest: true,
      } as AuthAxiosRequestConfig);

      const { accessToken: newToken } = response.data.data;

      updateAccessToken(newToken);
      processQueue(null, newToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }

      return api(originalRequest);
    } catch (refreshError: unknown) {
      const normalizedError: RefreshQueueError =
        refreshError instanceof Error
          ? refreshError
          : new Error('Refresh token process failed');

      processQueue(normalizedError, null);

      if (axios.isAxiosError(refreshError)) {
        console.error(
          '[Auth] Refresh failed with status:',
          refreshError.response?.status,
        );
        console.error(
          '[Auth] Refresh error response:',
          refreshError.response?.data,
        );
        console.error(
          '[Auth] Request headers sent:',
          refreshError.config?.headers,
        );
      } else {
        console.error('[Auth] Refresh failed (non-axios):', refreshError);
      }

      if (isAuthFailure(refreshError)) {
        clearTokens();
        window.location.href = '/login?session=expired';
      } else if (isTransientRefreshFailure(refreshError)) {
        console.warn(
          '[Auth] Refresh failed due to transient server/network error. Keeping current auth state.',
        );
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// Token management
export const saveTokens = (accessToken: string, rememberMe?: boolean): void => {
  if (rememberMe) {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
};

export const updateAccessToken = (accessToken: string): void => {
  if (localStorage.getItem(ACCESS_TOKEN_KEY) !== null) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
};

export const getAccessToken = (): string | null => {
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ??
    sessionStorage.getItem(ACCESS_TOKEN_KEY)
  );
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
};

/**
 * Get SignalR Hub base URL
 * For local dev: http://localhost:5000
 * For production: same as API_BASE_URL
 */
export const getSignalRUrl = (): string => {
  return env.baseUrl;
};
