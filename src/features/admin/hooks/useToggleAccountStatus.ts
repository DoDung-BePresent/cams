import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { accountService } from '../services/accountService';

export const useToggleAccountStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => accountService.toggleStatus(id),
    onSuccess: (response) => {
      message.success(
        response.data.message || 'Account status updated successfully!',
      );
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || 'Failed to toggle account status!';
      message.error(errorMessage);
    },
  });
};
