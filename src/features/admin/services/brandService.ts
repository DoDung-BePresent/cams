import { api } from '@/config/api';

/**
 * Types
 */
import type {
  BrandListItem,
  BrandDetailResponse,
  BrandRequest,
  BrandFilter,
} from '../types/brandTypes';
import type { PaginationResult } from '@/shared/types/commonTypes';

const BRAND_ENDPOINTS = {
  list: '/api/brands',
  detail: (id: string) => `/api/brands/${id}`,
  create: '/api/brands',
  update: (id: string) => `/api/brands/${id}`,
  delete: (id: string) => `/api/brands/${id}`,
};

export const brandService = {
  // GET /api/brands?page=1&pageSize=10
  getList: (filter: BrandFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
    if (filter.search) params.append('search', filter.search);
    if (filter.sortBy) params.append('sortBy', filter.sortBy);
    if (filter.isAscending !== undefined)
      params.append('isAscending', filter.isAscending.toString());
    if (filter.status) params.append('status', filter.status);
    if (filter.createdFrom) params.append('createdFrom', filter.createdFrom);
    if (filter.createdTo) params.append('createdTo', filter.createdTo);

    return api.get<PaginationResult<BrandListItem>>(
      `${BRAND_ENDPOINTS.list}?${params.toString()}`,
    );
  },

  // GET /api/brands/{id}
  getById: (id: string) =>
    api.get<{ isSuccess: boolean; data: BrandDetailResponse }>(
      BRAND_ENDPOINTS.detail(id),
    ),

  // POST /api/brands (multipart/form-data)
  create: (formData: FormData) =>
    api.post<{ isSuccess: boolean; message: string }>(
      BRAND_ENDPOINTS.create,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    ),

  // PATCH /api/brands/{id} (multipart/form-data)
  update: (id: string, formData: FormData) =>
    api.patch<{ isSuccess: boolean; message: string }>(
      BRAND_ENDPOINTS.update(id),
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    ),

  // DELETE /api/brands/{id}
  delete: (id: string) =>
    api.delete<{ isSuccess: boolean; message: string }>(
      BRAND_ENDPOINTS.delete(id),
    ),
};
