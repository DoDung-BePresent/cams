import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { spaceService } from '../services';

/**
 * Types
 */
import type { SpaceFilter } from '../types';

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
