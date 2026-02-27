import { useQuery } from '@tanstack/react-query';
import { accountService } from '../services/accountService';
import type { AccountFilter } from '../types/accountTypes';

export const useAccounts = (filter: AccountFilter = {}) => {
  return useQuery({
    queryKey: ['accounts', filter],
    queryFn: async () => {
      const response = await accountService.getList(filter);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
};
