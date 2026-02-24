import { ROLE_ENUM_MAP, ROLES } from '@/shared/constants/rolesConstants';

type JwtPayload = {
  sub: string;
  email: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string;
  exp: number;
  iss: string;
  aud: string;
};

export const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const base64Payload = token.split('.')[1];
    const decoded = JSON.parse(atob(base64Payload));
    return decoded as JwtPayload;
  } catch {
    return null;
  }
};

export const mapRoleFromEnum = (roles: number[]): string => {
  if (!roles || roles.length === 0) return '';
  return ROLE_ENUM_MAP[roles[0]] ?? '';
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwt(token);
  if (!payload) return true;
  return payload.exp * 1000 < Date.now();
};

export const getRoleFromJwt = (token: string): string => {
  const payload = decodeJwt(token);
  if (!payload) return '';

  const claimRole =
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

  const roleMap: Record<string, string> = {
    SystemAdmin: ROLES.SYSTEM_ADMIN,
    StoreManager: ROLES.STORE_MANAGER,
    BranchManager: ROLES.BRANCH_MANAGER,
  };

  return roleMap[claimRole] ?? claimRole;
};
