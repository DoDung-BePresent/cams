import { Navigate } from 'react-router';

/**
 * Pages
 */
import { SpaceList } from '@/features/store/pages/SpaceManagement/SpaceList';

const StoreDashboard = () => <div>Store Dashboard (Coming Soon)</div>;
const StoreSettings = () => <div>Settings (Coming Soon)</div>;

export const storeRoutes = [
  {
    path: 'dashboard',
    element: <StoreDashboard />,
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
    path: '*',
    element: (
      <Navigate
        to='/store/dashboard'
        replace
      />
    ),
  },
];
