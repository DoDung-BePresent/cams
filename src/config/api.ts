import axios, { type InternalAxiosRequestConfig } from 'axios';
import { env } from './env';

export const api = axios.create({
  baseURL: env.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ========== Request Interceptor ==========
// Tự động đính kèm accessToken vào mỗi request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Lấy token từ cả 2 storage (tùy rememberMe)
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
// Xử lý refresh token khi accessToken hết hạn
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken =
          localStorage.getItem('refreshToken') ||
          sessionStorage.getItem('refreshToken');

        if (!refreshToken) {
          // Không có refresh token → logout
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // ✅ Gọi refresh token API (chuẩn bị sẵn)
        const response = await axios.post(`${env.baseUrl}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        // Lưu token mới, giữ nguyên storage type
        const isRemembered = !!localStorage.getItem('accessToken');
        saveTokens(accessToken, newRefreshToken, isRemembered);

        // Retry request gốc với token mới
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh thất bại → logout
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// ========== Token Helpers ==========
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
