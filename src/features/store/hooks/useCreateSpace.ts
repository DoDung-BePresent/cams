import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

/**
 * Services
 */
import { spaceService } from '../services';

/**
 * Types
 */
import type { CreateSpaceRequest } from '../types';

/**
 * Utils
 */
import { showErrorMessage } from '@/shared/utils';

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
      showErrorMessage(error, 'Failed to create space');
    },
  });
};
