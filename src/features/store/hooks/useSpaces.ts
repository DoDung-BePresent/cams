import { useQuery } from '@tanstack/react-query';
import { spaceService } from '../services';
import type { SpaceFilter } from '../types';

/**
 * Hook to fetch spaces list (with pagination & filters)
 * StoreManager: Automatically filtered to their store
 */
export const useSpaces = (filter: SpaceFilter = {}) => {
  return useQuery({
    queryKey: ['spaces', filter],
    queryFn: async () => {
      const response = await spaceService.getList(filter);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
};
