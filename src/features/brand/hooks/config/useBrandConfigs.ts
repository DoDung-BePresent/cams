import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS, STALE_TIME } from '@/config';
import { configService } from '@/features/brand/services';
import type { ConfigBrandFilter } from '@/features/brand/types';

export const useBrandConfigs = (filter: ConfigBrandFilter = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.config.brandList(filter as Record<string, unknown>),
    queryFn: async () => {
      const response = await configService.getBrandList(filter);
      return response.data;
    },
    staleTime: STALE_TIME.medium,
    placeholderData: (previousData) => previousData,
  });
};
