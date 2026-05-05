import { api } from '@/config';
import type { Result } from '@/shared/types';
import type {
  BrandDashboardFilter,
  BrandDashboardResponse,
} from '../types';

const BRAND_DASHBOARD_ENDPOINTS = {
  snapshot: '/api/cms/brands/me/dashboard',
} as const;

const buildDashboardParams = (filter: BrandDashboardFilter = {}) => {
  const params = new URLSearchParams();

  if (filter.period !== undefined) params.append('period', String(filter.period));
  if (filter.fromUtc) params.append('fromUtc', filter.fromUtc);
  if (filter.toUtc) params.append('toUtc', filter.toUtc);
  if (filter.top !== undefined) params.append('top', String(filter.top));

  return params.toString();
};

export const brandDashboardService = {
  getDashboard: (filter: BrandDashboardFilter = {}) => {
    const query = buildDashboardParams(filter);
    const url = query
      ? `${BRAND_DASHBOARD_ENDPOINTS.snapshot}?${query}`
      : BRAND_DASHBOARD_ENDPOINTS.snapshot;

    return api.get<Result<BrandDashboardResponse>>(url);
  },
};
