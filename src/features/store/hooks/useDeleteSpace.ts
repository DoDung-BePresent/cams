import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { spaceService } from '../services';

/**
 * Hook to delete space (soft-delete)
 */
export const useDeleteSpace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => spaceService.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      message.success(response.data.message || 'Space deleted successfully');
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || 'Failed to delete space';
      message.error(errorMessage);
    },
  });
};
