/**
 * Node modules
 */
import { DashboardLayout } from '@/layouts/DashboardLayout';

export const MainRoutes = {
  path: '/',
  element: <DashboardLayout />,
  children: [
    {
      index: true,
      element: <p>Hello</p>,
    },
  ],
};
