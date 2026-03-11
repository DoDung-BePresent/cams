import { Navigate } from 'react-router';

/**
 * Hooks
 */
import { useAuth } from '@/providers/AuthProvider';

/**
 * Constants
 */
import { ROLES } from '@/shared/constants/rolesConstants';

const ROLE_HOME_MAP: Record<string, string> = {
  [ROLES.SYSTEM_ADMIN]: '/admin/dashboard',
  [ROLES.BRAND_MANAGER]: '/brand/dashboard',
  [ROLES.STORE_MANAGER]: '/store/dashboard',
};

export const RedirectIfAuthenticated = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { isAuthenticated, user } = useAuth();

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
