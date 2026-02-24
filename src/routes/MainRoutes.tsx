import { Navigate } from 'react-router';

/**
 * Layouts
 */
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { StoreDashboardLayout } from '@/layouts/StoreDashboardLayout';

/**
 * Shared
 */
import { ROLES } from '@/shared/constants/rolesConstants';
import { ProtectedRoute } from '@/shared/components/common/ProtectedRoute';

/**
 * Features
 */
import { adminRoutes } from '@/features/admin/routes/adminRoutes';
import { managerRoutes } from '@/features/manager/routes/managerRoutes';

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
    path: '/manager',
    element: (
      <ProtectedRoute
        allowedRoles={[ROLES.STORE_MANAGER, ROLES.BRANCH_MANAGER]}
      >
        <StoreDashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Navigate
            to='/manager/dashboard'
            replace
          />
        ),
      },
      ...managerRoutes,
    ],
  },
];
