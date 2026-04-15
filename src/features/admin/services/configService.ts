import { api } from '@/config';

import type {
  ConfigPolicyFilter,
  ConfigPolicyPaginationResult,
  ConfigSystemFilter,
  ConfigSystemPaginationResult,
  UpsertPolicyRequest,
  UpsertSystemValueRequest,
} from '@/features/admin/types';
import type { Result } from '@/shared/types';

const CONFIG_ENDPOINTS = {
  system: '/api/cms/config/system',
  policy: '/api/cms/config/policy',
} as const;

export const configService = {
  getPolicyList: (filter: ConfigPolicyFilter = {}) => {
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

    return api.get<ConfigPolicyPaginationResult>(
      `${CONFIG_ENDPOINTS.policy}?${params.toString()}`,
    );
  },

  getSystemList: (filter: ConfigSystemFilter = {}) => {
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
    if (filter.scopeType !== undefined) {
      params.append('scopeType', filter.scopeType.toString());
    }
    if (filter.scopeId) params.append('scopeId', filter.scopeId);

    return api.get<ConfigSystemPaginationResult>(
      `${CONFIG_ENDPOINTS.system}?${params.toString()}`,
    );
  },

  upsertPolicy: (data: UpsertPolicyRequest) =>
    api.put<Result<string>>(CONFIG_ENDPOINTS.policy, data),

  upsertSystemValue: (data: UpsertSystemValueRequest) =>
    api.put<Result<string>>(`${CONFIG_ENDPOINTS.system}/value`, data),
};
