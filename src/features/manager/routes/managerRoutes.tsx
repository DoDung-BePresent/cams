import { Loadable } from '@/shared/components/common/Loadable';

const ManagerDashboard = Loadable(
  () => import('@/features/manager/pages/Dashboard'),
  'ManagerDashboard',
);

// const MusicControl = Loadable(
//   () => import('@/features/manager/pages/MusicControl'),
//   'MusicControl',
// );

export const managerRoutes = [
  {
    path: 'dashboard',
    element: <ManagerDashboard />,
  },
  // {
  //   path: 'music-control/mode',
  //   element: <MusicControl />,
  // },
  // Add more manager routes...
];
