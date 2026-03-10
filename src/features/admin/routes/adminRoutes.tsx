import { Loadable } from '@/shared/components/common/Loadable';

const AdminDashboard = Loadable(
  () => import('@/features/admin/pages/Dashboard'),
  'AdminDashboard',
);

const BrandList = Loadable(
  () => import('@/features/admin/pages/BrandManagement/BrandList'),
  'BrandList',
);

const AccountList = Loadable(
  () => import('@/features/admin/pages/AccountManagement/AccountList'),
  'AccountList',
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
    path: 'accounts',
    element: <AccountList />,
  },
];
