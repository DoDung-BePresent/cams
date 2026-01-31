/**
 * Node modules
 */
import { DashboardLayout } from '@/layouts/DashboardLayout';

export const MainRoutes = {
  path: '/',
  element: <DashboardLayout />,
  children: [
    {
      path: '/',
      element: <p>Hello</p>,
    },
  ],
};
