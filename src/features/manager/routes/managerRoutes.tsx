import { Loadable } from '@/shared/components/common/Loadable';

const ManagerDashboard = Loadable(
  () => import('@/features/manager/pages/Dashboard'),
  'ManagerDashboard',
);

const StoreList = Loadable(
  () => import('@/features/manager/pages/StoreManagement/StoreList'),
  'StoreList',
);

const StaffList = Loadable(
  () => import('@/features/manager/pages/StaffManagement/StaffList'),
  'StaffList',
);

const SpaceList = Loadable(
  () => import('@/features/manager/pages/SpaceManagement/SpaceList'),
  'SpaceList',
);

const DeviceList = Loadable(
  () => import('@/features/manager/pages/DeviceManagement/DeviceList'),
  'DeviceList',
);

export const managerRoutes = [
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
