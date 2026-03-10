import { useQuery } from '@tanstack/react-query';
import { storeService } from '../services/storeService';

export const useStore = (id: string | undefined, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['store', id],
    queryFn: async () => {
      if (!id) throw new Error('Store ID is required');
      const response = await storeService.getById(id);
      return response.data.data;
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};
