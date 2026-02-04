import { Loadable } from '@/shared/components/common/Loadable';

const AdminDashboard = Loadable(
  () => import('@/features/admin/pages/Dashboard'),
  'AdminDashboard',
);

const StoreList = Loadable(
  () => import('@/features/admin/pages/StoreManagement/StoreList'),
  'StoreList',
);

const BranchList = Loadable(
  () => import('@/features/admin/pages/BranchManagement/BranchList'),
  'BranchList',
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
    path: 'stores',
    element: <StoreList />,
  },
  {
    path: 'stores/:storeId/branches',
    element: <BranchList />,
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
