import { Loadable } from '@/shared/components/common/Loadable';

/**
 * Pages
 */
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

const TrackList = Loadable(
  () => import('@/features/admin/pages/TrackManagement/TrackList'),
  'TrackList',
);

const PlaylistList = Loadable(
  () => import('@/features/admin/pages/PlaylistManagement/PlaylistList'),
  'PlaylistList',
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
  {
    path: 'tracks',
    element: <TrackList />,
  },
  {
    path: 'playlists',
    element: <PlaylistList />,
  },
];
