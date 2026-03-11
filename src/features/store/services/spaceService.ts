import { api } from '@/config/api';
import { SPACE_ENDPOINTS } from '../constants';
import type {
  SpaceFilter,
  SpacePaginationResult,
  SpaceDetailResponse,
  CreateSpaceRequest,
  UpdateSpaceRequest,
} from '../types';
import type { Result } from '@/shared/types/commonTypes';

/**
 * Space Service
 * All endpoints according to API_Spaces.md
 */
export const spaceService = {
  /**
   * GET /api/spaces - List spaces with pagination & filters
   * Authorization: StoreManager (own store)
   * Note: storeId filter is auto-overridden to user.StoreId
   */
  getList: (filter: SpaceFilter = {}) => {
    const params = new URLSearchParams();

    // Pagination
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());

    // Search & Sort
    if (filter.search) params.append('search', filter.search);
    if (filter.sortBy) params.append('sortBy', filter.sortBy);
    if (filter.isAscending !== undefined)
      params.append('isAscending', filter.isAscending.toString());

    // Status
    if (filter.status !== undefined)
      params.append('status', filter.status.toString());

    // Space-specific filters
    if (filter.type !== undefined)
      params.append('type', filter.type.toString());
    if (filter.createdFrom) params.append('createdFrom', filter.createdFrom);
    if (filter.createdTo) params.append('createdTo', filter.createdTo);

    return api.get<SpacePaginationResult>(
      `${SPACE_ENDPOINTS.list}?${params.toString()}`,
    );
  },

  /**
   * GET /api/spaces/{id} - Get space detail
   * Authorization: StoreManager (own store)
   */
  getById: (id: string) => {
    return api.get<Result<SpaceDetailResponse>>(SPACE_ENDPOINTS.detail(id));
  },

  /**
   * POST /api/spaces - Create new space
   * Authorization: StoreManager (own store)
   * Note: storeId in body is ignored (auto-filled from user.StoreId)
   */
  create: (data: CreateSpaceRequest) => {
    return api.post<Result>(SPACE_ENDPOINTS.create, data);
  },

  /**
   * PUT /api/spaces/{id} - Update space (partial)
   * Authorization: StoreManager (own store)
   */
  update: (id: string, data: UpdateSpaceRequest) => {
    return api.put<Result>(SPACE_ENDPOINTS.update(id), data);
  },

  /**
   * DELETE /api/spaces/{id} - Soft-delete space
   * Authorization: StoreManager (own store)
   */
  delete: (id: string) => {
    return api.delete<Result>(SPACE_ENDPOINTS.delete(id));
  },

  /**
   * PUT /api/spaces/{id}/toggle-status - Toggle space status
   * Authorization: StoreManager (own store)
   */
  toggleStatus: (id: string) => {
    return api.put<Result>(SPACE_ENDPOINTS.toggleStatus(id));
  },
};
