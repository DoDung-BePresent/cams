export type UserRole = 'STORE_MANAGER' | 'BRANCH_MANAGER';

export type UserStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED';

export type StoreUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  store_id: string;
  invited_at?: string;
  activated_at?: string;
  suspended_at?: string;
  created_at: string;
  updated_at: string;
};

export type InviteUserDto = {
  email: string;
  role: UserRole;
};
