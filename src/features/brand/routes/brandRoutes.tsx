import { Loadable } from '@/shared/components/common/Loadable';

/**
 * Pages
 */
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

const TrackList = Loadable(
  () => import('@/features/brand/pages/TrackManagement/TrackList'),
  'TrackList',
);

const PlaylistList = Loadable(
  () => import('@/features/brand/pages/PlaylistManagement/PlaylistList'),
  'PlaylistList',
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
    path: 'tracks',
    element: <TrackList />,
  },
  {
    path: 'playlists',
    element: <PlaylistList />,
  },
];
