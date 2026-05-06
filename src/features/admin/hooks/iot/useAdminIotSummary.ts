import { useQuery } from '@tanstack/react-query';

import { STALE_TIME } from '@/config';
import { adminIotService } from '@/features/admin/services';

export const useAdminIotSummary = () => {
  return useQuery({
    queryKey: ['admin-iot-summary'],
    queryFn: async () => {
      const response = await adminIotService.getSummary();
      return response.data;
    },
    staleTime: STALE_TIME.short,
    refetchInterval: 10_000,
  });
};
