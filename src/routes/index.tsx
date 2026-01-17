/**
 * Node modules
 */
import { createBrowserRouter, Navigate } from 'react-router';

/**
 * Custom modules
 */
import { ProtectedRoute } from './protected-route';

/**
 * Layouts
 */
import { AuthLayout } from '@/components/layouts/auth-layout';

/**
 * Pages
 */
import { LoginPage } from '@/features/auth/pages/login-page';
import { MainLayout } from '@/components/layouts/main-layout';

// Dashboard Placeholder
const Dashboard = () => (
  <div>
    <h1>Dashboard Overview</h1>
  </div>
);

export const router = createBrowserRouter([
  // Public Routes (Login, Register, Forgot Password)
  {
    path: '/auth', // Prefix /auth cho rõ ràng (hoặc root tùy bạn)
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      // Thêm register nếu cần
      {
        path: '',
        element: (
          <Navigate
            to='login'
            replace
          />
        ),
      },
    ],
  },

  // Protected Routes (Cần đăng nhập mới xem được)
  {
    path: '/',
    // element: <ProtectedRoute />, // 🛡️ Guard Layer
    children: [
      {
        element: <MainLayout />, // 🎨 Layout Layer (Sidebar, Header)
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: 'stores',
            element: <div>Store Management</div>,
          },
          // Thêm các feature routes khác ở đây
        ],
      },
    ],
  },

  // Fallback route cho login
  {
    path: '/login',
    element: (
      <Navigate
        to='/auth/login'
        replace
      />
    ),
  },

  // 404 Page
  {
    path: '*',
    element: (
      <div className='flex h-screen items-center justify-center'>
        404 Not Found
      </div>
    ),
  },
]);
