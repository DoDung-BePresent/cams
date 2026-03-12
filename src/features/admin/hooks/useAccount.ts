import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { accountService } from '../services';

export const useAccount = (id: string | undefined, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      if (!id) throw new Error('Account ID is required');
      const response = await accountService.getById(id);
      return response.data.data;
    },
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
};
