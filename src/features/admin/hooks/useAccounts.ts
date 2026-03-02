import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { accountService } from '../services/accountService';

/**
 * Types
 */
import { RoleEnum } from '../types/accountTypes';
import type { AccountFilter } from '../types/accountTypes';

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
