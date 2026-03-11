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

const DeviceList = Loadable(
  () => import('@/features/brand/pages/DeviceManagement/DeviceList'),
  'DeviceList',
);

const TrackList = Loadable(
  () => import('@/features/brand/pages/TrackManagement/TrackList'),
  'TrackList',
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
    path: 'devices',
    element: <DeviceList />,
  },
  {
    path: 'tracks',
    element: <TrackList />,
  },
];
