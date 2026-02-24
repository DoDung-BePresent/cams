import { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Configs
 */
import { saveTokens, clearTokens, getAccessToken } from '@/config/api';

/**
 * Utils
 */
import {
  decodeJwt,
  mapRoleFromEnum,
  isTokenExpired,
  getRoleFromJwt,
} from '@/shared/utils/jwt';

/**
 * Hooks
 */
import { useProfile } from '@/features/auth/hooks/useProfile';

/**
 * Services
 */
import { authService } from '@/features/auth/services/authService';

/**
 * Types
 */
import type {
  AuthContextType,
  LoginPayload,
  User,
} from '@/features/auth/types/authTypes';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (token && !isTokenExpired(token)) {
      setAccessToken(token);
    } else if (token) {
      clearTokens();
    }
    setIsInitializing(false);
  }, []);

  const { data: user, isLoading: isLoadingProfile } = useProfile(!!accessToken);

  const login = async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    const { accessToken: token, refreshToken, roles } = response.data.data;

    saveTokens(token, refreshToken ?? null, payload.rememberMe);
    setAccessToken(token);
    await queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      clearTokens();
      setAccessToken(null);
      
      queryClient.setQueryData(['profile'], null);
      queryClient.removeQueries({ queryKey: ['profile'] });
    }
  };

  if (isInitializing || (accessToken && isLoadingProfile)) {
    return null; // Hoặc <Spin fullscreen />
  }

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        accessToken,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
