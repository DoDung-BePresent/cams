import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS, STALE_TIME } from '@/config';
import { configService } from '@/features/admin/services';
import type { ConfigStoreFilter } from '@/features/admin/services/configService';

export const useConfigStoreList = (filter: ConfigStoreFilter = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.config.storeList(filter as Record<string, unknown>),
    queryFn: async () => {
      const response = await configService.getStoreList(filter);
      return response.data;
    },
    staleTime: STALE_TIME.medium,
    placeholderData: (previousData) => previousData,
  });
};
