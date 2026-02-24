import { Navigate } from 'react-router';
import { useAuth } from '@/providers/AuthProvider';
import { ROLES } from '@/shared/constants/rolesConstants';

const ROLE_HOME_MAP: Record<string, string> = {
  [ROLES.SYSTEM_ADMIN]: '/admin/dashboard',
  [ROLES.STORE_MANAGER]: '/manager/dashboard',
  [ROLES.BRANCH_MANAGER]: '/manager/dashboard',
};

export const RedirectIfAuthenticated = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { isAuthenticated, user } = useAuth();

  console.log('IS AUTHENTICATION:', isAuthenticated);
  console.log('USER:', user);

  if (isAuthenticated && user) {
    const redirectTo = ROLE_HOME_MAP[user.role] ?? '/unauthorized';
    return (
      <Navigate
        to={redirectTo}
        replace
      />
    );
  }

  return <>{children}</>;
};
