import { Loadable } from '@/shared/components/common/Loadable';

const AdminDashboard = Loadable(
  () => import('@/features/admin/pages/Dashboard'),
  'AdminDashboard',
);

// const StoreList = Loadable(
//   () => import('@/features/admin/pages/StoreManagement/StoreList'),
//   'StoreList',
// );

export const adminRoutes = [
  {
    path: 'dashboard',
    element: <AdminDashboard />,
  },
  // {
  //   path: 'stores',
  //   element: <StoreList />,
  // },
  // Add more admin routes...
];
