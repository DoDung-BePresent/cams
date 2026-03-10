import type { EntityStatusEnum } from '@/shared/types/commonTypes';

// Enums
export enum RoleEnum {
  SystemAdmin = 0,
  BrandManager = 1,
  StoreManager = 2,
}

// Request DTOs
export type CreateAccountRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: RoleEnum; // Admin chỉ tạo BrandManager (role = 1)
  brandId?: string; // Required nếu role = BrandManager
  storeId?: string; // null cho BrandManager
  avatar?: File;
};

export type UpdateAccountRequest = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  avatar?: File;
};

export type ResetPasswordRequest = {
  newPassword: string;
};

export type AssignBrandRequest = {
  newBrandId: string;
};

export type AssignStoreRequest = {
  newStoreId: string | null;
};

// Filter
export type AccountFilter = {
  page?: number;
  pageSize?: number;
  search?: string; // Search email, name, phone
  sortBy?: string;
  isAscending?: boolean;
  status?: EntityStatusEnum;
  role?: RoleEnum; // Admin filter: 0 (SA) hoặc 1 (BM)
  brandId?: string; // Filter by brand
  storeId?: string; // Filter by store
  joiningFrom?: string; // ISO 8601
  joiningTo?: string;
  isPrimaryOwner?: boolean; // true/false/null
};

// Response DTOs
export type AccountListItem = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string; // Computed by backend
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  lastLoginAt: string | null; // ISO 8601 UTC
  roles: RoleEnum[]; // Array of role enums (int[])
  brandId: string | null; // null for SystemAdmin
  brandName: string | null;
  storeId: string | null;
  storeName: string | null;
  isPrimaryOwner: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  status: EntityStatusEnum;
};

export type AccountDetailResponse = AccountListItem & {
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
};

export type AccountListFilter = Omit<AccountFilter, 'role'>;
