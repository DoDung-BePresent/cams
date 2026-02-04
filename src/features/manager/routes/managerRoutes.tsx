import { Loadable } from '@/shared/components/common/Loadable';

const ManagerDashboard = Loadable(
  () => import('@/features/manager/pages/Dashboard'),
  'ManagerDashboard',
);

const SpaceList = Loadable(
  () => import('@/features/manager/pages/SpaceManagement/SpaceList'),
  'SpaceList',
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
];
