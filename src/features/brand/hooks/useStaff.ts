import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { staffService } from '../services/staffService';

/**
 * Types
 */
import { RoleEnum } from '../types/staffTypes';
import type { StaffFilter } from '../types/staffTypes';

export const useStaff = (filter: Omit<StaffFilter, 'role'> = {}) => {
  return useQuery({
    queryKey: ['staff', filter],
    queryFn: async () => {
      const response = await staffService.getList({
        ...filter,
        role: RoleEnum.StoreManager,
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
};
