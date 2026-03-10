import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { spaceService } from '../services';
import type { CreateSpaceRequest } from '../types';

/**
 * Hook to create new space
 * StoreManager: storeId is auto-filled from session
 */
export const useCreateSpace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSpaceRequest) => spaceService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      message.success(response.data.message || 'Space created successfully');
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || 'Failed to create space';
      message.error(errorMessage);
    },
  });
};
