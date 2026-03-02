import { api } from '@/config/api';
import type {
  StoreFilter,
  StoreListItem,
  StoreDetailResponse,
  StoreRequest,
} from '../types/storeTypes';
import type { PaginationResult } from '@/shared/types/commonTypes';

const STORE_ENDPOINTS = {
  list: '/api/stores',
  detail: (id: string) => `/api/stores/${id}`,
  create: '/api/stores',
  update: (id: string) => `/api/stores/${id}`,
  toggleStatus: (id: string) => `/api/stores/${id}/toggle-status`,
} as const;

export const storeService = {
  // GET /api/stores (with pagination & filters)
  getList: (filter: StoreFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
    if (filter.search) params.append('search', filter.search);
    if (filter.sortBy) params.append('sortBy', filter.sortBy);
    if (filter.isAscending !== undefined)
      params.append('isAscending', filter.isAscending.toString());
    if (filter.city) params.append('city', filter.city);
    if (filter.district) params.append('district', filter.district);
    if (filter.status !== undefined)
      params.append('status', filter.status.toString());

    return api.get<PaginationResult<StoreListItem>>(
      `${STORE_ENDPOINTS.list}?${params.toString()}`,
    );
  },

  // GET /api/stores/{id}
  getById: (id: string) =>
    api.get<{ isSuccess: boolean; data: StoreDetailResponse }>(
      STORE_ENDPOINTS.detail(id),
    ),

  // POST /api/stores (JSON body)
  create: (data: StoreRequest) =>
    api.post<{ isSuccess: boolean; message: string }>(
      STORE_ENDPOINTS.create,
      data,
    ),

  // PUT /api/stores/{id} (JSON body)
  update: (id: string, data: StoreRequest) =>
    api.put<{ isSuccess: boolean; message: string }>(
      STORE_ENDPOINTS.update(id),
      data,
    ),

  // PUT /api/stores/{id}/toggle-status
  toggleStatus: (id: string) =>
    api.put<{ isSuccess: boolean; message: string }>(
      STORE_ENDPOINTS.toggleStatus(id),
    ),
};
