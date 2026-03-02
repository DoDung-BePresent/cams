import type {
  BaseResponse,
  EntityStatusEnum,
} from '@/shared/types/commonTypes';

// Enums - Reuse from account types
export enum RoleEnum {
  SystemAdmin = 0,
  BrandManager = 1,
  StoreManager = 2,
}

// Request DTOs for StoreManager
export type CreateStaffRequest = {
  firstName: string; // Required, max 100 chars
  lastName: string; // Required, max 100 chars
  email: string; // Required, unique, valid email
  password: string; // Required, min 6 chars
  phoneNumber?: string; // Optional, valid phone format
  storeId: string; // Required - which store this StoreManager manages
  avatar?: File; // Optional, max 5MB
};

export type UpdateStaffRequest = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  avatar?: File;
};

export type AssignStaffStoreRequest = {
  newStoreId: string | null; // null = unassign, string = assign new store
};

export type ResetStaffPasswordRequest = {
  newPassword: string; // Min 6 chars
};

// Filter
export type StaffFilter = {
  page?: number;
  pageSize?: number;
  search?: string; // Search by name, email, phone
  sortBy?: string; // 'firstname' | 'lastname' | 'email' | 'createdat'
  isAscending?: boolean;
  status?: EntityStatusEnum;
  storeId?: string; // Filter by assigned store
};

// Response DTOs
export type StaffListItem = BaseResponse & {
  firstName: string;
  lastName: string;
  fullName: string; // firstName + lastName
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  roles: RoleEnum[]; // Always [RoleEnum.StoreManager]
  brandId: string;
  brandName: string | null;
  storeId: string | null;
  storeName: string | null;
};

export type StaffDetailResponse = StaffListItem & {
  // Same as StaffListItem for now
  // Can add more fields later if needed
};
