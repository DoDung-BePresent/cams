import { api } from '@/config';

import type {
  ConfigStoreFilter,
  ConfigStorePaginationResult,
  UpsertStoreValueRequest,
} from '@/features/store/types';
import type { Result } from '@/shared/types';

const CONFIG_ENDPOINTS = {
  store: '/api/cms/config/store',
  storeValue: '/api/cms/config/store-value',
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

    return api.get<ConfigStorePaginationResult>(
      `${CONFIG_ENDPOINTS.store}?${params.toString()}`,
    );
  },

  upsertStoreValue: (data: UpsertStoreValueRequest) =>
    api.put<Result<string>>(CONFIG_ENDPOINTS.storeValue, data),
};
