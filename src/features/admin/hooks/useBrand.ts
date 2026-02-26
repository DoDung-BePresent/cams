import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { brandService } from '../services/brandService';

export const useBrand = (id: string | undefined, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['brand', id],
    queryFn: async () => {
      if (!id) throw new Error('Brand ID is required');
      const response = await brandService.getById(id);
      return response.data.data;
    },
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
};
