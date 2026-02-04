import { Loadable } from '@/shared/components/common/Loadable';

const ManagerDashboard = Loadable(
  () => import('@/features/manager/pages/Dashboard'),
  'ManagerDashboard',
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
    path: 'spaces',
    element: <SpaceList />,
  },
  {
    path: 'devices',
    element: <DeviceList />,
  },
];