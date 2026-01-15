/**
 * Node modules
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';

/**
 * Libs
 */
import { queryClient } from '@/lib/react-query';
import { AuthProvider } from '@/lib/auth-provider';

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {/* Thêm ThemeProvider, ToastProvider ở đây nếu có */}
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};
