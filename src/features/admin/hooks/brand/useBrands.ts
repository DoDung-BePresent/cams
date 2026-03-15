import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { brandService } from '@/features/admin/services';

/**
 * Types
 */
import type { BrandFilter } from '@/features/admin/types';
import { STALE_TIME } from '@/config';

export const useBrands = (filter: BrandFilter = {}) => {
  return useQuery({
    queryKey: ['brands', filter],
    queryFn: async () => {
      const response = await brandService.getList(filter);
      return response.data;
    },
    staleTime: STALE_TIME.medium,
    placeholderData: (previousData) => previousData,
  });
};
