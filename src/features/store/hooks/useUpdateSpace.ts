import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { spaceService } from '../services';
import type { UpdateSpaceRequest } from '../types';
import { showErrorMessage } from '@/shared/utils';

/**
 * Hook to update space (partial update)
 */
export const useUpdateSpace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSpaceRequest }) =>
      spaceService.update(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['space', id] });
      message.success(response.data.message || 'Space updated successfully');
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to update space');
    },
  });
};
