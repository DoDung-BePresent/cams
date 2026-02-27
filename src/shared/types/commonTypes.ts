export enum EntityStatusEnum {
  Inactive = 0,
  Active = 1,
  Pending = 2,
  Rejected = 3,
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
