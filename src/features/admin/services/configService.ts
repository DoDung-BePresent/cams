import { api } from '@/config';

import type {
  ConfigBrandDetailItem,
  ConfigFlatRowItem,
  ConfigPolicyFilter,
  ConfigPolicyPaginationResult,
  ConfigSpaceDetailItem,
  ConfigStoreDetailItem,
  ConfigSystemFilter,
  ConfigSystemPaginationResult,
  UpsertPolicyRequest,
  UpsertSystemValueRequest,
} from '@/features/admin/types';
import type {
  BasePaginationFilter,
  PaginationResult,
  Result,
} from '@/shared/types';

// ── Re-exported filter types used by brand/store list endpoints ───────────────
export type ConfigBrandFilter = BasePaginationFilter & {
  domain?: number;
  key?: string;
  keyPrefix?: string;
};

export type ConfigStoreFilter = BasePaginationFilter & {
  domain?: number;
  key?: string;
  keyPrefix?: string;
  storeId?: string;
};

export type ConfigSpaceFilter = BasePaginationFilter & {
  domain?: number;
  key?: string;
  keyPrefix?: string;
  spaceId?: string;
};

export type UpsertBrandValueRequest = {
  key: string;
  domain: number;
  valueType: number;
  value: string;
  overrideIntent?: number;
  overrideReason?: string;
  targetStoreIds?: string[];
};

export type UpsertStoreValueRequest = {
  key: string;
  domain: number;
  valueType: number;
  value: string;
  storeId?: string;
  overrideIntent?: number;
  overrideReason?: string;
  targetSpaceIds?: string[];
};

export type UpsertSpaceValueRequest = {
  spaceId: string;
  key: string;
  domain: number;
  valueType: number;
  value: string;
  overrideReason?: string;
};

export type ConfigFlatPaginationResult = PaginationResult<ConfigFlatRowItem>;

const CONFIG_ENDPOINTS = {
  system: '/api/cms/config/system',
  policy: '/api/cms/config/policy',
  brand: '/api/cms/config/brand',
  store: '/api/cms/config/store',
  brandValue: '/api/cms/config/brand-value',
  storeValue: '/api/cms/config/store-value',
  storeById: (storeId: string) => `/api/cms/config/store/${storeId}`,
  storeValueById: (storeId: string) => `/api/cms/config/store/${storeId}/value`,
  spaceById: (spaceId: string) => `/api/cms/config/space/${spaceId}`,
  spaceValueById: (spaceId: string) => `/api/cms/config/space/${spaceId}/value`,
  brandDetailByKey: (key: string) =>
    `/api/cms/config/brand/key/${encodeURIComponent(key)}`,
  storeDetailByKey: (key: string) =>
    `/api/cms/config/store/key/${encodeURIComponent(key)}`,
  storeDetailByKeyForStore: (storeId: string, key: string) =>
    `/api/cms/config/store/${storeId}/key/${encodeURIComponent(key)}`,
  spaceDetailByKey: (spaceId: string, key: string) =>
    `/api/cms/config/space/${spaceId}/key/${encodeURIComponent(key)}`,
} as const;

/** Builds common pagination + config filter params shared across all config endpoints. */
const buildBaseParams = (
  filter: BasePaginationFilter & {
    domain?: number;
    key?: string;
    keyPrefix?: string;
  },
) => {
  const params = new URLSearchParams();
  if (filter.page) params.append('page', filter.page.toString());
  if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
  if (filter.search) params.append('search', filter.search);
  if (filter.sortBy) params.append('sortBy', filter.sortBy);
  if (filter.isAscending !== undefined)
    params.append('isAscending', filter.isAscending.toString());
  if (filter.domain !== undefined)
    params.append('domain', filter.domain.toString());
  if (filter.key) params.append('key', filter.key);
  if (filter.keyPrefix) params.append('keyPrefix', filter.keyPrefix);
  return params;
};

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

  // ── Brand config ──────────────────────────────────────────────────────────

  getBrandList: (filter: ConfigBrandFilter = {}) => {
    const params = buildBaseParams(filter);
    return api.get<ConfigFlatPaginationResult>(
      `${CONFIG_ENDPOINTS.brand}?${params.toString()}`,
    );
  },

  getDetailByBrand: (key: string) =>
    api.get<Result<ConfigBrandDetailItem>>(
      CONFIG_ENDPOINTS.brandDetailByKey(key),
    ),

  upsertBrandValue: (data: UpsertBrandValueRequest) =>
    api.put<Result<string>>(CONFIG_ENDPOINTS.brandValue, data),

  // ── Store config ──────────────────────────────────────────────────────────

  getStoreList: (filter: ConfigStoreFilter = {}) => {
    const params = buildBaseParams(filter);
    if (filter.storeId) params.append('storeId', filter.storeId);
    const base = filter.storeId
      ? CONFIG_ENDPOINTS.storeById(filter.storeId)
      : CONFIG_ENDPOINTS.store;
    return api.get<ConfigFlatPaginationResult>(`${base}?${params.toString()}`);
  },

  getDetailByStore: (key: string, storeId?: string) =>
    api.get<Result<ConfigStoreDetailItem>>(
      storeId
        ? CONFIG_ENDPOINTS.storeDetailByKeyForStore(storeId, key)
        : CONFIG_ENDPOINTS.storeDetailByKey(key),
    ),

  upsertStoreValue: (data: UpsertStoreValueRequest) => {
    if (data.storeId) {
      return api.put<Result<string>>(
        CONFIG_ENDPOINTS.storeValueById(data.storeId),
        data,
      );
    }
    return api.put<Result<string>>(CONFIG_ENDPOINTS.storeValue, data);
  },

  // ── Space config ──────────────────────────────────────────────────────────

  getSpaceList: (spaceId: string, filter: ConfigSpaceFilter = {}) => {
    const params = buildBaseParams(filter);
    return api.get<ConfigFlatPaginationResult>(
      `${CONFIG_ENDPOINTS.spaceById(spaceId)}?${params.toString()}`,
    );
  },

  getDetailBySpace: (spaceId: string, key: string) =>
    api.get<Result<ConfigSpaceDetailItem>>(
      CONFIG_ENDPOINTS.spaceDetailByKey(spaceId, key),
    ),

  upsertSpaceValue: (data: UpsertSpaceValueRequest) =>
    api.put<Result<string>>(
      CONFIG_ENDPOINTS.spaceValueById(data.spaceId),
      data,
    ),
};
