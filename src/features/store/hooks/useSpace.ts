import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { spaceService } from '../services';

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
