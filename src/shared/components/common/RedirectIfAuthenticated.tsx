import { Navigate } from 'react-router';

/**
 * Hooks
 */
import { useAuth } from '@/providers';

/**
 * Constants
 */
import { ROLES } from '@/shared/constants';

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
    const primaryRole = user.roles[0];
    const redirectTo = ROLE_HOME_MAP[primaryRole] ?? '/unauthorized';

    return (
      <Navigate
        to={redirectTo}
        replace
      />
    );
  }
  return <>{children}</>;
};
