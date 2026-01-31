/**
 * Components
 */
import { Loadable } from '@/shared/components/common/Loadable';

/**
 * Pages
 */
const LoginPage = Loadable(
  () => import('@/features/auth/pages/LoginPage'),
  'LoginPage',
);
const RegisterPage = Loadable(
  () => import('@/features/auth/pages/RegisterPage'),
  'RegisterPage',
);

export const AuthRoutes = {
  path: '/',
  children: [
    {
      path: '/',
      children: [
        {
          path: '/login',
          element: <LoginPage />,
        },
        {
          path: '/register',
          element: <RegisterPage />,
        },
      ],
    },
  ],
};
