import { Loadable } from '@/shared/components/common/Loadable';

const AdminDashboard = Loadable(
  () => import('@/features/admin/pages/Dashboard'),
  'AdminDashboard',
);

const BrandList = Loadable(
  () => import('@/features/admin/pages/BrandManagement/BrandList'),
  'BrandList',
);

const UserList = Loadable(
  () => import('@/features/admin/pages/UserManagement/UserList'),
  'UserList',
);

const UserDetail = Loadable(
  () => import('@/features/admin/pages/UserManagement/UserDetail'),
  'UserDetail',
);

export const adminRoutes = [
  {
    path: 'dashboard',
    element: <AdminDashboard />,
  },
  {
    path: 'brands',
    element: <BrandList />,
  },
  {
    path: 'users',
    element: <UserList />,
  },
  {
    path: 'users/:userId',
    element: <UserDetail />,
  },
];
