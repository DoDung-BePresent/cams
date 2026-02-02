import { RouterProvider } from 'react-router';

import { AppProvider } from '@/providers/AppProvider';
import { router } from '@/routes';
import { ScrollTop } from '@/shared/components/common/ScrollTop';
import { ErrorBoundary } from '@/shared/components/common/ErrorBoundary';

export const App = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <ScrollTop>
          <RouterProvider router={router} />
        </ScrollTop>
      </AppProvider>
    </ErrorBoundary>
  );
};
