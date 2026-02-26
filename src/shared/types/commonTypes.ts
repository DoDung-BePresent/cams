export enum EntityStatusEnum {
  Inactive = 'Inactive',
  Active = 'Active',
  Pending = 'Pending',
  Rejected = 'Rejected',
}

export type BaseResponse = {
  id: string;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  status: EntityStatusEnum;
};

export type PaginationResult<T> = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  items: T[];
};
