import { Navigate } from 'react-router';
import { Loadable } from '@/shared/components/common/Loadable';

/**
 * Pages
 */
const SpaceList = Loadable(
  () => import('@/features/store/pages/SpaceManagement/SpaceList'),
  'SpaceList',
);

const TrackList = Loadable(
  () => import('@/features/store/pages/TrackManagement/TrackList'),
  'TrackList',
);

const PlaylistList = Loadable(
  () => import('@/features/store/pages/PlaylistManagement/PlaylistList'),
  'PlaylistList',
);

const Dashboard = Loadable(
  () => import('@/features/store/pages/Dashboard'),
  'StoreDashboard',
);

/* eslint-disable react-refresh/only-export-components */
const StoreSettings = () => <div>Settings (Coming Soon)</div>;

export const storeRoutes = [
  {
    path: 'dashboard',
    element: <Dashboard />,
  },
  {
    path: 'spaces',
    element: <SpaceList />,
  },
  {
    path: 'settings',
    element: <StoreSettings />,
  },
  {
    path: 'tracks',
    element: <TrackList />,
  },
  {
    path: 'playlists',
    element: <PlaylistList />,
  },
  {
    path: '*',
    element: (
      <Navigate
        to='/store/dashboard'
        replace
      />
    ),
  },
];
