import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { trackService } from '@/shared/modules/tracks/services';

/**
 * Types
 */
import type { TrackFilter } from '@/shared/modules/tracks/types';

export const useTracks = (filter: TrackFilter = {}) => {
  return useQuery({
    queryKey: ['tracks', filter],
    queryFn: async () => {
      const response = await trackService.getList(filter);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
};
