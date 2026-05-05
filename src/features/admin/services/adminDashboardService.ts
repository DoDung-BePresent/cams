import { api } from '@/config';

import type { Result } from '@/shared/types';
import type { AdminDashboardFilter, AdminDashboardResponse } from '../types';

export const adminDashboardService = {
  getDashboard: (filter: AdminDashboardFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.period) params.append('period', filter.period.toString());
    if (filter.fromUtc) params.append('fromUtc', filter.fromUtc);
    if (filter.toUtc) params.append('toUtc', filter.toUtc);
    if (filter.top) params.append('top', filter.top.toString());

    return api.get<Result<AdminDashboardResponse>>(
      `/api/admin/dashboard?${params.toString()}`,
    );
  },
};
