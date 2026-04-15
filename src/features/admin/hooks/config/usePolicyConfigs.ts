import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS, STALE_TIME } from '@/config';
import { configService } from '@/features/admin/services';
import type { ConfigPolicyFilter } from '@/features/admin/types';

export const usePolicyConfigs = (filter: ConfigPolicyFilter = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.config.policyList(filter as Record<string, unknown>),
    queryFn: async () => {
      const response = await configService.getPolicyList(filter);
      return response.data;
    },
    staleTime: STALE_TIME.medium,
    placeholderData: (previousData) => previousData,
  });
};
