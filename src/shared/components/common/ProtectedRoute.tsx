import { Navigate } from 'react-router';

/**
 * Providers
 */
import { useAuth } from '@/providers/AuthProvider';

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles: string[];
};

export const ProtectedRoute = ({
  children,
  allowedRoles,
}: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth();

  console.log('user.role:', user?.role);
  console.log('allowedRoles:', allowedRoles);
  console.log('includes check:', allowedRoles.includes(user?.role ?? ''));

  if (!isAuthenticated) {
    return (
      <Navigate
        to='/login'
        replace
      />
    );
  }

  if (user && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to='/unauthorized'
        replace
      />
    );
  }

  return <>{children}</>;
};
