import axios, { type InternalAxiosRequestConfig } from 'axios';
import { env } from './env';

const options: CreateAxiosDefaults = {
  baseURL: env.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
};

export const api = axios.create(options);
const apiRefresh = axios.create(options);

// ========== Request Interceptor ==========
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ========== Response Interceptor ==========
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await apiRefresh.post('/api/auth/refresh-token');

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        const isRemembered = !!localStorage.getItem('accessToken');
        saveTokens(accessToken, newRefreshToken ?? null, isRemembered);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export const saveTokens = (
  accessToken: string,
  refreshToken: string | null,
  rememberMe: boolean,
) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem('accessToken', accessToken);
  if (refreshToken) {
    storage.setItem('refreshToken', refreshToken);
  }
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
};

export const getAccessToken = (): string | null =>
  localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
