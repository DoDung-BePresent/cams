import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { brandService } from '@/features/admin/services';

/**
 * Types
 */
import type { BrandFilter } from '@/features/admin/types';

export const useBrands = (filter: BrandFilter = {}) => {
  return useQuery({
    queryKey: ['brands', filter],
    queryFn: async () => {
      const response = await brandService.getList(filter);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
};
