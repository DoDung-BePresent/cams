import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { storeService } from '../services/storeService';
import { showErrorMessage } from '@/shared/utils/errorHandler';

export const useCreateStore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StoreRequest) => storeService.create(data),
    onSuccess: (response) => {
      message.success(response.data.message || 'Store created successfully!');
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to create store!');
    },
  });
};
