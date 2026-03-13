import { useQuery } from '@tanstack/react-query';

/**
 * Services
 */
import { staffService } from '@/features/brand/services';

export const useStaffDetail = (
  id: string | undefined,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ['staff-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Staff ID is required');
      const response = await staffService.getById(id);
      return response.data.data;
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};
