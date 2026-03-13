import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { staffService } from '@/features/brand/services';

/**
 * Types
 */
import { RoleEnum } from '@/shared/types';
import type { StaffFilter } from '@/features/brand/types';

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
