import { useQuery } from '@tanstack/react-query';

import { STALE_TIME } from '@/config';
import { adminDashboardService } from '@/features/admin/services';
import type { AdminDashboardFilter } from '@/features/admin/types';

export const useAdminDashboard = (filter: AdminDashboardFilter = {}) => {
  return useQuery({
    queryKey: ['admin-dashboard', filter],
    queryFn: async () => {
      const response = await adminDashboardService.getDashboard(filter);
      return response.data;
    },
    staleTime: STALE_TIME.short,
    refetchInterval: 30_000,
  });
};
