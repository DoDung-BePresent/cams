import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

/**
 * Services
 */
import { spaceService } from '../services';

/**
 * Utils
 */
import { showErrorMessage } from '@/shared/utils';

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
      showErrorMessage(error, 'Failed to delete space');
    },
  });
};
