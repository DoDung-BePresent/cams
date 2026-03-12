import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { showErrorMessage } from '@/shared/utils';
import { trackService } from '../services';
import type { UpdateTrackRequest } from '../types';

export const useUpdateTrack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTrackRequest }) =>
      trackService.update(id, data),
    onSuccess: (response, variables) => {
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['tracks'] });
        queryClient.invalidateQueries({ queryKey: ['tracks', variables.id] });
        message.success(response.data.message || 'Track updated successfully!');
      }
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to update track.');
    },
  });
};
