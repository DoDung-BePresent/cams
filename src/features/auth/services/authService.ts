import { api } from '@/config/api';
import type { LoginPayload, LoginResponse } from '../types/authTypes';

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>('/api/auth/login', payload),

  // ✅ Chuẩn bị sẵn cho tương lai
  logout: () => api.post('/api/auth/logout'),

  refreshToken: (refreshToken: string) =>
    api.post('/api/auth/refresh', { refreshToken }),

  getProfile: () => api.get('/api/auth/me'), // Nếu có
};
