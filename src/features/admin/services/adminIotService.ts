import { api } from '@/config';

import type { PaginationResult, Result } from '@/shared/types';
import type {
  AdminIotCommandHistoryItem,
  AdminIotSpaceDetail,
  AdminIotSpaceFilter,
  AdminIotSpaceListItem,
  AdminIotSummary,
  SendAdminIotCommandRequest,
} from '../types';

export const adminIotService = {
  getSummary: () => api.get<Result<AdminIotSummary>>('/api/admin/iot/summary'),

  getSpaces: (filter: AdminIotSpaceFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
    if (filter.search) params.append('search', filter.search);
    if (filter.status !== undefined)
      params.append('status', filter.status.toString());
    if (filter.brandId) params.append('brandId', filter.brandId);
    if (filter.storeId) params.append('storeId', filter.storeId);
    if (filter.spaceId) params.append('spaceId', filter.spaceId);
    if (filter.healthStatus)
      params.append('healthStatus', filter.healthStatus.toString());
    if (filter.latestCommandStatus)
      params.append(
        'latestCommandStatus',
        filter.latestCommandStatus.toString(),
      );
    if (filter.isAssigned !== undefined)
      params.append('isAssigned', String(filter.isAssigned));

    return api.get<PaginationResult<AdminIotSpaceListItem>>(
      `/api/admin/iot/spaces?${params.toString()}`,
    );
  },

  getSpaceDetail: (spaceId: string) =>
    api.get<Result<AdminIotSpaceDetail>>(`/api/admin/iot/spaces/${spaceId}`),

  getCommandHistory: (spaceId: string, page = 1, pageSize = 10) =>
    api.get<PaginationResult<AdminIotCommandHistoryItem>>(
      `/api/admin/iot/spaces/${spaceId}/commands?page=${page}&pageSize=${pageSize}`,
    ),

  sendCommand: (spaceId: string, payload: SendAdminIotCommandRequest) =>
    api.post<Result<AdminIotCommandHistoryItem>>(
      `/api/admin/iot/spaces/${spaceId}/commands`,
      payload,
    ),
};
