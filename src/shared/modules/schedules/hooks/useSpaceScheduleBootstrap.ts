import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS, STALE_TIME } from '@/config';
import { scheduleService } from '@/shared/modules/schedules/services';

export const useSpaceScheduleBootstrap = (spaceId?: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.schedules.bootstrap(spaceId),
    enabled: enabled && !!spaceId,
    queryFn: async () => {
      if (!spaceId) {
        throw new Error('Space id is required');
      }
      const response = await scheduleService.getBootstrap(spaceId);
      return response.data.data;
    },
    staleTime: STALE_TIME.short,
  });
};
