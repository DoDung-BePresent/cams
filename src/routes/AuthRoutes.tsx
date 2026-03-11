/**
 * Components
 */
import { Loadable } from '@/shared/components/common/Loadable';
import { RedirectIfAuthenticated } from '@/shared/components/common/RedirectIfAuthenticated';

/**
 * Pages
 */
const LoginPage = Loadable(
  () => import('@/features/auth/pages/LoginPage'),
  'LoginPage',
);

export const AuthRoutes = {
  path: '/',
  children: [
    {
      path: 'login',
      element: (
        <RedirectIfAuthenticated>
          <LoginPage />
        </RedirectIfAuthenticated>
      ),
    },
  ],
};
