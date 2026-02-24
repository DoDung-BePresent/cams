import { createContext, useContext, useState, useEffect } from 'react';

/**
 * Configs
 */
import { saveTokens, clearTokens, getAccessToken } from '@/config/api';

/**
 * Shared
 */
import {
  decodeJwt,
  mapRoleFromEnum,
  isTokenExpired,
  getRoleFromJwt,
} from '@/shared/utils/jwt';

/**
 * Features
 */
import { authService } from '@/features/auth/services/authService';
import type {
  AuthContextType,
  LoginPayload,
  User,
} from '@/features/auth/types/authTypes';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (token && !isTokenExpired(token)) {
      const payload = decodeJwt(token);
      if (payload) {
        setUser({
          id: payload.sub,
          email: payload.email,
          name: payload.email.split('@')[0],
          role: getRoleFromJwt(token),
        });
        setAccessToken(token);
      }
    } else if (token) {
      clearTokens();
    }
    setIsLoading(false);
  }, []);

  const login = async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    const { accessToken: token, refreshToken, roles } = response.data.data;

    saveTokens(token, refreshToken ?? null, payload.rememberMe);
    setAccessToken(token);

    const jwtPayload = decodeJwt(token);
    if (jwtPayload) {
      const role = mapRoleFromEnum(roles);
      setUser({
        id: jwtPayload.sub,
        email: jwtPayload.email,
        name: jwtPayload.email.split('@')[0],
        role,
      });
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    setAccessToken(null);
  };

  if (isLoading) return null;

  return (
    <AuthContext.Provider
      value={{
        user,
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
