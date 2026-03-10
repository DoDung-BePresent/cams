import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { spaceService } from '../services';
import { showErrorMessage } from '@/shared/utils/errorHandler';

/**
 * Hook to toggle space status (Active ↔ Inactive)
 */
export const useToggleSpaceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => spaceService.toggleStatus(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      message.success(
        response.data.message || 'Space status updated successfully',
      );
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to update space status');
    },
  });
};
