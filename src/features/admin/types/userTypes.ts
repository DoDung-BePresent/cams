export type UserRole = 'ADMIN' | 'STORE_MANAGER' | 'BRANCH_MANAGER';

export type UserStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED';

// Global User entity
export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
};

// Store-User relationship
export type StoreUser = {
  id: string;
  store_id: string;
  store_name: string;
  assigned_at: string;
};

// Branch-User relationship
export type BranchUser = {
  id: string;
  branch_id: string;
  branch_name: string;
  store_id: string;
  store_name: string;
  assigned_at: string;
};

export type CreateUserPayload = {
  email: string;
  role: UserRole;
};

export type AssignStorePayload = {
  store_id: string;
};

export type AssignBranchPayload = {
  branch_id: string;
};
