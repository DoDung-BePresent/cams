import { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { message } from 'antd';

/**
 * Configs
 */
import { saveTokens, clearTokens, getAccessToken } from '@/config/api';

/**
 * Utils
 */
import { isTokenExpired } from '@/shared/utils';

/**
 * Hooks
 */
import { useProfile } from '@/features/auth/hooks';

/**
 * Services
 */
import { authService } from '@/features/auth/services';

/**
 * Types
 */
import type { LoginPayload, User } from '@/features/auth/types';
import type { UseMutationResult } from '@tanstack/react-query';

type EnhancedAuthContextType = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: UseMutationResult<void, Error, LoginPayload>;
  logout: UseMutationResult<void, Error, void>;
};

const AuthContext = createContext<EnhancedAuthContextType | undefined>(
  undefined,
);

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

  const loginMutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await authService.login(payload);
      const { accessToken: token, refreshToken } = response.data.data;

      saveTokens(token, refreshToken ?? null, payload.rememberMe);
      setAccessToken(token);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onSuccess: () => {
      message.success('Login successful!');
    },
    // onError: (error) => {
    //   handleApiError(
    //     error,
    //     {
    //       [ErrorCodeEnum.InvalidCredentials]: () => {
    //         message.error(ERROR_MESSAGES[ErrorCodeEnum.InvalidCredentials]);
    //       },
    //       [ErrorCodeEnum.Forbidden]: () => {
    //         message.error('You do not have permission to access CMS!');
    //       },
    //     },
    //     'Login failed! Please try again.',
    //   );
    // },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await authService.logout();
      } catch (error) {
        console.error('Logout API failed:', error);
      }
    },
    onSuccess: () => {
      clearTokens();
      setAccessToken(null);
      queryClient.setQueryData(['profile'], null);
      queryClient.removeQueries({ queryKey: ['profile'] });
    },
  });

  if (isInitializing || (accessToken && isLoadingProfile)) {
    return null; // Or <Spin fullscreen />
  }

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        accessToken,
        isAuthenticated: !!user,
        login: loginMutation,
        logout: logoutMutation,
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
