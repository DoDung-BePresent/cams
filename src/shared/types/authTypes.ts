import type { UserRole } from '@/shared/constants/roles';

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  storeId?: string; // For manager
};

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};
