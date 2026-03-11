import { api } from '@/config/api';
import type {
  LoginPayload,
  LoginResponse,
  ProfileResponse,
} from '../types/authTypes';

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>('/api/auth/login', payload),

  logout: () => api.post('/api/auth/logout'),

  refreshToken: () => api.post('/api/auth/refresh-token'),

  getProfile: () => api.get<ProfileResponse>('/api/auth/profile'),
};
