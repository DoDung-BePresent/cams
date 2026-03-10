import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { accountService } from '../services/accountService';

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      accountService.update(id, formData),
    onSuccess: (response, variables) => {
      message.success(response.data.message || 'Account updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['account', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || 'Failed to update account!';
      message.error(errorMessage);
    },
  });
};
