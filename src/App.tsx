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

/**
 * Components
 */
import { ScrollTop } from '@/shared/components/common/ScrollTop';

export const App = () => {
  return (
    <AppProvider>
      <ScrollTop>
        <RouterProvider router={router} />
      </ScrollTop>
    </AppProvider>
  );
};
