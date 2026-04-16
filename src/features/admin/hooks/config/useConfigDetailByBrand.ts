import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS, STALE_TIME } from '@/config';
import { configService } from '@/features/admin/services';

export const useConfigDetailByBrand = (key?: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.config.brandDetail(key),
    queryFn: async () => {
      const response = await configService.getDetailByBrand(key!);
      return response.data.data ?? null;
    },
    enabled: !!key && enabled,
    staleTime: STALE_TIME.medium,
  });
};
