/**
 * Components
 */
import { Loadable, RedirectIfAuthenticated } from '@/shared/components';

/**
 * Pages
 */
const LoginPage = Loadable(
  () => import('@/features/auth/pages/LoginPage'),
  'LoginPage',
);

const ForgotPasswordPage = Loadable(
  () => import('@/features/auth/pages/ForgotPasswordPage'),
  'ForgotPasswordPage',
);

const RegisterPage = Loadable(
  () => import('@/features/auth/pages/RegisterPage'),
  'RegisterPage',
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
    {
      path: 'forgot-password',
      element: (
        <RedirectIfAuthenticated>
          <ForgotPasswordPage />
        </RedirectIfAuthenticated>
      ),
    },
    {
      path: 'register',
      element: (
        <RedirectIfAuthenticated>
          <RegisterPage />
        </RedirectIfAuthenticated>
      ),
    },
  ],
};
