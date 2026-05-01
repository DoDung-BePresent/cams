import { useQuery } from '@tanstack/react-query';

import { STALE_TIME } from '@/config';
import { brandDashboardService } from '@/features/brand/services';
import type { BrandDashboardFilter } from '@/features/brand/types';

export const BRAND_DASHBOARD_QUERY_KEY = 'brand-dashboard';

export const getBrandDashboardQueryKey = (filter: BrandDashboardFilter = {}) =>
  [BRAND_DASHBOARD_QUERY_KEY, filter] as const;

export const useBrandDashboard = (filter: BrandDashboardFilter = {}) => {
  return useQuery({
    queryKey: getBrandDashboardQueryKey(filter),
    queryFn: async () => {
      const response = await brandDashboardService.getDashboard(filter);
      return response.data.data;
    },
    staleTime: STALE_TIME.short,
    placeholderData: (previousData) => previousData,
  });
};
