import { useQuery } from '@tanstack/react-query';
import { spaceService } from '../services';

/**
 * Hook to fetch space detail by ID
 * @param id - Space ID
 * @param enabled - Whether to run the query (default: true if id exists)
 */
export const useSpace = (id?: string, enabled = true) => {
  return useQuery({
    queryKey: ['space', id],
    queryFn: async () => {
      if (!id) throw new Error('Space ID is required');
      const response = await spaceService.getById(id);
      return response.data.data;
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};
