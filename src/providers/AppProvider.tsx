/**
 * Providers
 */
import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';

/**
 * Components
 */
import { NetworkStatusBanner } from '@/shared/components/common/NetworkStatusBanner';

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <NetworkStatusBanner />
          {children}
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
};
