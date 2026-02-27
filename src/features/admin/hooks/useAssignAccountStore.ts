import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { accountService } from '../services/accountService';
import type { AssignStoreRequest } from '../types/accountTypes';

export const useAssignAccountStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignStoreRequest }) =>
      accountService.assignStore(id, data),
    onSuccess: (response, variables) => {
      message.success(
        response.data.message || 'Store assignment updated successfully!',
      );
      queryClient.invalidateQueries({ queryKey: ['account', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || 'Failed to update store assignment!';
      message.error(errorMessage);
    },
  });
};
