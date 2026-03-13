import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { trackService } from '@/shared/modules/tracks/services';

export const useTrack = (id?: string, enabled = true) => {
  return useQuery({
    queryKey: ['tracks', id],
    queryFn: async () => {
      if (!id) throw new Error('Track ID is required');
      const response = await trackService.getById(id);
      return response.data.data;
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};
