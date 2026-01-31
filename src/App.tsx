/**
 * Node modules
 */
import { RouterProvider } from 'react-router';

/**
 * Providers
 */
import { AppProvider } from '@/providers/AppProvider';

/**
 * Routes
 */
import { router } from '@/routes';

export const App = () => {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
};
