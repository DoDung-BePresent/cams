import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS, STALE_TIME } from '@/config';
import { configService } from '@/features/admin/services';
import type { ConfigSystemFilter } from '@/features/admin/types';

export const useSystemConfigs = (filter: ConfigSystemFilter = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.config.systemList(filter as Record<string, unknown>),
    queryFn: async () => {
      const response = await configService.getSystemList(filter);
      return response.data;
    },
    staleTime: STALE_TIME.medium,
    placeholderData: (previousData) => previousData,
  });
};
