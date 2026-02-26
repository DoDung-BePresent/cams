import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { brandService } from '../services/brandService';

/**
 * Types
 */
import type { BrandFilter } from '../types/brandTypes';

export const useBrands = (filter: BrandFilter = {}) => {
  return useQuery({
    queryKey: ['brands', filter],
    queryFn: async () => {
      const response = await brandService.getList(filter);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });
};
