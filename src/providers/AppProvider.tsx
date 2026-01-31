/**
 * Providers
 */
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryProvider>
  );
};
