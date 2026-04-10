import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { trackService } from '@/shared/modules/tracks/services';

/**
 * Types
 */
import type { TrackFilter } from '@/shared/modules/tracks/types';
import { STALE_TIME } from '@/config';

export const useBlockedTracksForAdmin = (filter: TrackFilter = {}) => {
  return useQuery({
    queryKey: ['tracks', 'admin-blocked', filter],
    queryFn: async () => {
      const response = await trackService.getBlockedForAdmin(filter);
      return response.data;
    },
    staleTime: STALE_TIME.medium,
    placeholderData: (previousData) => previousData,
  });
};
