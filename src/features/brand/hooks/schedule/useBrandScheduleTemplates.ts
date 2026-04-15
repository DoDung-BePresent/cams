import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS, STALE_TIME } from '@/config';
import { scheduleService } from '@/features/brand/services';

export const useBrandScheduleTemplates = (brandId?: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.schedules.templates(brandId),
    queryFn: async () => {
      const response = await scheduleService.getTemplates(brandId!);
      return response.data.data || [];
    },
    enabled: !!brandId && enabled,
    staleTime: STALE_TIME.medium,
  });
};
