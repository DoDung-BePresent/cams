import { useQuery } from '@tanstack/react-query';
import { staffService } from '../services/staffService';
import type { StaffFilter } from '../types/staffTypes';

export const useStaff = (filter: StaffFilter = {}) => {
  return useQuery({
    queryKey: ['staff', filter],
    queryFn: async () => {
      const response = await staffService.getList(filter);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
};
