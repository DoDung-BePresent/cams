import { useQuery } from '@tanstack/react-query';

import { STALE_TIME } from '@/config';
import { adminIotService } from '@/features/admin/services';
import type { AdminIotSpaceFilter } from '@/features/admin/types';

export const useAdminIotSpaces = (filter: AdminIotSpaceFilter = {}) => {
  return useQuery({
    queryKey: ['admin-iot-spaces', filter],
    queryFn: async () => {
      const response = await adminIotService.getSpaces(filter);
      return response.data;
    },
    staleTime: STALE_TIME.short,
    placeholderData: (previousData) => previousData,
  });
};
