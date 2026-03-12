import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { accountService } from '@/features/admin/services';

/**
 * Types
 */
import { RoleEnum } from '@/shared/types';
import type { AccountFilter } from '@/features/admin/types';

export const useAccounts = (filter: Omit<AccountFilter, 'role'> = {}) => {
  return useQuery({
    queryKey: ['accounts', filter],
    queryFn: async () => {
      const response = await accountService.getList({
        ...filter,
        role: RoleEnum.BrandManager,
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
};
