export type UserRole = 'ADMIN' | 'STORE_MANAGER';

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
};

export type AuthResponse = {
  user: User;
  token: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};
