/**
 * Libs
 */
import { http } from '@/lib/http';

/**
 * Types
 */
import type { LoginCredentials, AuthResponse, User } from '../types';

export const loginWithEmail = async (
  data: LoginCredentials,
): Promise<AuthResponse> => {
  const response = await http.post<AuthResponse>('/auth/login', data);
  return response.data;
};

export const getUserProfile = async (): Promise<User> => {
  const response = await http.get<User>('/auth/me');
  return response.data;
};

export const logout = async () => {
  // Nếu backend cần gọi API logout
  // return http.post('/auth/logout');
  localStorage.removeItem('token');
};
