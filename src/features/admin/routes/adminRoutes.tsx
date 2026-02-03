import { Loadable } from '@/shared/components/common/Loadable';

const AdminDashboard = Loadable(
  () => import('@/features/admin/pages/Dashboard'),
  'AdminDashboard',
);

const StoreList = Loadable(
  () => import('@/features/admin/pages/StoreManagement/StoreList'),
  'StoreList',
);

const StoreManagers = Loadable(
  () => import('@/features/admin/pages/StoreManagement/StoreManagers'),
  'StoreManagers',
);

const BranchList = Loadable(
  () => import('@/features/admin/pages/BranchManagement/BranchList'),
  'BranchList',
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
    path: 'stores/:storeId/managers',
    element: <StoreManagers />,
  },
  {
    path: 'stores/:storeId/branches',
    element: <BranchList />,
  },
];
