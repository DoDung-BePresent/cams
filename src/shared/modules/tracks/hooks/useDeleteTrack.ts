import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { showErrorMessage } from '@/shared/utils';
import { trackService } from '../services';

export const useDeleteTrack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trackService.delete(id),
    onSuccess: (response) => {
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['tracks'] });
        message.success(response.data.message || 'Track deleted successfully!');
      }
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to delete track.');
    },
  });
};
