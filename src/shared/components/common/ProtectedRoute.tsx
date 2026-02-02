import { Navigate } from 'react-router';
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

  if (!isAuthenticated) {
    return (
      <Navigate
        to='/login'
        replace
      />
    );
  }

  if (!allowedRoles.includes(user!.role)) {
    return (
      <Navigate
        to='/unauthorized'
        replace
      />
    );
  }

  return <>{children}</>;
};
