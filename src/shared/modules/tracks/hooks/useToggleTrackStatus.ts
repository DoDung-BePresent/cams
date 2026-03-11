import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { showErrorMessage } from '@/shared/utils/errorHandler';
import { trackService } from '../services';

export const useToggleTrackStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trackService.toggleStatus(id),
    onSuccess: (response) => {
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['tracks'] });
        message.success(
          response.data.message || 'Track status updated successfully!',
        );
      }
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to update track status.');
    },
  });
};
