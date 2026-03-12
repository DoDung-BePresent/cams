import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { storeService } from '../services/storeService';
import { showErrorMessage } from '@/shared/utils';

export const useToggleStoreStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storeService.toggleStatus(id),
    onSuccess: (response) => {
      message.success(
        response.data.message || 'Store status updated successfully!',
      );
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to toggle store status!');
    },
  });
};
