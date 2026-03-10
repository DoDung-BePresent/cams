import { Loadable } from '@/shared/components/common/Loadable';

const ManagerDashboard = Loadable(
  () => import('@/features/brand/pages/Dashboard'),
  'BrandDashboard',
);

const StoreList = Loadable(
  () => import('@/features/brand/pages/StoreManagement/StoreList'),
  'StoreList',
);

const StaffList = Loadable(
  () => import('@/features/brand/pages/StaffManagement/StaffList'),
  'StaffList',
);

const SpaceList = Loadable(
  () => import('@/features/brand/pages/SpaceManagement/SpaceList'),
  'SpaceList',
);

const DeviceList = Loadable(
  () => import('@/features/brand/pages/DeviceManagement/DeviceList'),
  'DeviceList',
);

export const brandRoutes = [
  {
    path: 'dashboard',
    element: <ManagerDashboard />,
  },
  {
    path: 'stores',
    element: <StoreList />,
  },
  {
    path: 'staff',
    element: <StaffList />,
  },
  {
    path: 'spaces',
    element: <SpaceList />,
  },
  {
    path: 'devices',
    element: <DeviceList />,
  },
];
