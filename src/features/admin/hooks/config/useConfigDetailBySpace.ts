import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS, STALE_TIME } from '@/config';
import { configService } from '@/features/admin/services';

export const useConfigDetailBySpace = (
  spaceId?: string,
  key?: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.config.spaceDetail(spaceId, key),
    queryFn: async () => {
      const response = await configService.getDetailBySpace(spaceId!, key!);
      return response.data.data ?? null;
    },
    enabled: !!spaceId && !!key && enabled,
    staleTime: STALE_TIME.medium,
  });
};
