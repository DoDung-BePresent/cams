import { api } from '@/config';

import type {
  ConfigStoreFilter,
  ConfigStorePaginationResult,
  UpsertStoreValueRequest,
} from '@/features/store/types';
import type { Result } from '@/shared/types';

const CONFIG_ENDPOINTS = {
  store: '/api/cms/config/store',
  storeById: (storeId: string) => `/api/cms/config/store/${storeId}`,
  storeValue: '/api/cms/config/store-value',
  storeValueById: (storeId: string) => `/api/cms/config/store/${storeId}/value`,
} as const;

export const configService = {
  getStoreList: (filter: ConfigStoreFilter = {}) => {
    const params = new URLSearchParams();

    if (filter.page) params.append('page', filter.page.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
    if (filter.search) params.append('search', filter.search);
    if (filter.sortBy) params.append('sortBy', filter.sortBy);
    if (filter.isAscending !== undefined) {
      params.append('isAscending', filter.isAscending.toString());
    }
    if (filter.domain !== undefined) {
      params.append('domain', filter.domain.toString());
    }
    if (filter.key) params.append('key', filter.key);
    if (filter.keyPrefix) params.append('keyPrefix', filter.keyPrefix);

    const endpoint = filter.storeId
      ? CONFIG_ENDPOINTS.storeById(filter.storeId)
      : CONFIG_ENDPOINTS.store;

    return api.get<ConfigStorePaginationResult>(
      `${endpoint}?${params.toString()}`,
    );
  },

  upsertStoreValue: (data: UpsertStoreValueRequest) => {
    const { storeId, ...payload } = data;
    const endpoint = storeId
      ? CONFIG_ENDPOINTS.storeValueById(storeId)
      : CONFIG_ENDPOINTS.storeValue;

    return api.put<Result<string>>(endpoint, payload);
  },
};
