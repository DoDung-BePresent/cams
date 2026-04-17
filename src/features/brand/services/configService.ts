import { api } from '@/config';

import type {
  ConfigBrandFilter,
  ConfigBrandPaginationResult,
  SetStoreGovernanceModeRequest,
  UpsertBrandValueRequest,
} from '@/features/brand/types';
import type { Result } from '@/shared/types';

const CONFIG_ENDPOINTS = {
  brand: '/api/cms/config/brand',
  brandValue: '/api/cms/config/brand-value',
  storeGovernanceMode: '/api/cms/config/stores/governance-mode',
} as const;

export const configService = {
  getBrandList: (filter: ConfigBrandFilter = {}) => {
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

    return api.get<ConfigBrandPaginationResult>(
      `${CONFIG_ENDPOINTS.brand}?${params.toString()}`,
    );
  },

  upsertBrandValue: (data: UpsertBrandValueRequest) =>
    api.put<Result<string>>(CONFIG_ENDPOINTS.brandValue, data),

  setStoreGovernanceMode: (data: SetStoreGovernanceModeRequest) =>
    api.patch<Result<string[]>>(CONFIG_ENDPOINTS.storeGovernanceMode, data),
};
