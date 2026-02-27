import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { accountService } from '../services/accountService';

export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => accountService.create(formData),
    onSuccess: (response) => {
      message.success(response.data.message || 'Account created successfully!');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || 'Failed to create account!';
      message.error(errorMessage);
    },
  });
};
