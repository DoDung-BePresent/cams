import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { brandService } from '@/features/admin/services';

/**
 * Configs
 */
import { STALE_TIME } from '@/config';

export const useBrand = (id: string | undefined, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['brand', id],
    queryFn: async () => {
      if (!id) throw new Error('Brand ID is required');
      const response = await brandService.getById(id);
      return response.data.data;
    },
    enabled: !!id && enabled,
    staleTime: STALE_TIME.medium,
  });
};
