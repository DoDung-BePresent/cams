import type { EntityStatusEnum, RoleEnum } from '@/shared/types/commonTypes';

export type CreateAccountRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: RoleEnum;
  brandId?: string;
  storeId?: string;
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

export type AccountFilter = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  isAscending?: boolean;
  status?: EntityStatusEnum;
  role?: RoleEnum;
  brandId?: string;
  storeId?: string;
  joiningFrom?: string;
  joiningTo?: string;
  isPrimaryOwner?: boolean;
};

export type AccountListItem = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  roles: RoleEnum[];
  brandId: string | null;
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
