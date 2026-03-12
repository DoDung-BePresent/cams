import { Navigate } from 'react-router';

/**
 * Layouts
 */
import {
  AdminDashboardLayout,
  BrandDashboardLayout,
  StoreDashboardLayout,
} from '@/layouts';

/**
 * Constants
 */
import { ROLES } from '@/shared/constants';

/**
 * Components
 */
import { ProtectedRoute } from '@/shared/components';

/**
 * Routes
 */
import { adminRoutes } from '@/features/admin/routes';
import { brandRoutes } from '@/features/brand/routes';
import { storeRoutes } from '@/features/store/routes';

export const MainRoutes = [
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN]}>
        <AdminDashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Navigate
            to='/admin/dashboard'
            replace
          />
        ),
      },
      ...adminRoutes,
    ],
  },
  {
    path: '/brand',
    element: (
      <ProtectedRoute allowedRoles={[ROLES.BRAND_MANAGER]}>
        <BrandDashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Navigate
            to='/brand/dashboard'
            replace
          />
        ),
      },
      ...brandRoutes,
    ],
  },
  {
    path: '/store',
    element: (
      <ProtectedRoute allowedRoles={[ROLES.STORE_MANAGER]}>
        <StoreDashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Navigate
            to='/store/dashboard'
            replace
          />
        ),
      },
      ...storeRoutes,
    ],
  },
];
