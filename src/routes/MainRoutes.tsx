import { Navigate } from 'react-router';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ROLES } from '@/shared/constants/roles';
import { ProtectedRoute } from '@/shared/components/common/ProtectedRoute';
import { adminRoutes } from '@/features/admin/routes/adminRoutes';
import { managerRoutes } from '@/features/manager/routes/managerRoutes';

export const MainRoutes = [
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
        <DashboardLayout />
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
      <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
        <DashboardLayout />
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
