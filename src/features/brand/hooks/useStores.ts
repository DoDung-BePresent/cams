import { useQuery } from '@tanstack/react-query';
import { storeService } from '../services/storeService';
import type { StoreFilter } from '../types/storeTypes';

export const useStores = (filter: StoreFilter = {}) => {
  return useQuery({
    queryKey: ['stores', filter],
    queryFn: async () => {
      const response = await storeService.getList(filter);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
};
