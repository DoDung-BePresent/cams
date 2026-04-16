import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS, STALE_TIME } from '@/config';
import { configService } from '@/features/admin/services';
import type { ConfigSpaceFilter } from '@/features/admin/services/configService';

export const useConfigSpaceList = (
  spaceId: string,
  filter: ConfigSpaceFilter = {},
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.config.spaceList({
      spaceId,
      ...filter,
    } as Record<string, unknown>),
    queryFn: async () => {
      const response = await configService.getSpaceList(spaceId, filter);
      return response.data;
    },
    enabled: !!spaceId && enabled,
    staleTime: STALE_TIME.medium,
    placeholderData: (previousData) => previousData,
  });
};
