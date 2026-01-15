/**
 * Node modules
 */
import { Navigate, Outlet, useLocation } from 'react-router';

/**
 * Libs
 */
import { useAuth } from '@/lib/auth-provider';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        {/* Thay bằng LoadingSpinner component của bạn */}
        <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect về login nhưng giữ lại state location để redirect ngược lại sau khi login xong
    return (
      <Navigate
        to='/login'
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
};
