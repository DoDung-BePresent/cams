import { Navigate } from 'react-router';

/**
 * Layouts
 */
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { BrandDashboardLayout } from '@/layouts/BrandDashboardLayout';

/**
 * Shared
 */
import { ROLES } from '@/shared/constants/rolesConstants';
import { ProtectedRoute } from '@/shared/components/common/ProtectedRoute';

/**
 * Features
 */
import { adminRoutes } from '@/features/admin/routes/adminRoutes';
import { brandRoutes } from '@/features/brand/routes/brandRoutes';

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
];
