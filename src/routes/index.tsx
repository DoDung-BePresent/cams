import { createBrowserRouter, Navigate } from 'react-router';
import { AuthRoutes } from './AuthRoutes';
import { MainRoutes } from './MainRoutes';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Navigate
        to='/login'
        replace
      />
    ),
  },
  AuthRoutes,
  ...MainRoutes,
]);
