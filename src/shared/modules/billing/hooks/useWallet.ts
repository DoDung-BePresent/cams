import { useQuery } from '@tanstack/react-query';
import { billingService } from '../services/billingService';
import { STALE_TIME } from '@/config';

export const useWallet = (brandId?: string) => {
  return useQuery({
    queryKey: ['billing', 'wallet', brandId],
    queryFn: async () => {
      const response = await billingService.getWallet(brandId);
      if (!response.data.isSuccess || !response.data.data) {
        throw new Error(response.data.message || 'Failed to load wallet');
      }
      return response.data.data;
    },
    staleTime: STALE_TIME.short,
  });
};
