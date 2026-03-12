import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { showErrorMessage } from '@/shared/utils';
import { trackService } from '../services';
import type { CreateTrackRequest } from '../types';

export const useCreateTrack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTrackRequest) => trackService.create(data),
    onSuccess: (response) => {
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['tracks'] });

        if (!response.data.data?.audioUrl) {
          message.warning(
            'Track created but audio upload failed. Please try uploading again.',
            5,
          );
        } else {
          message.success(
            response.data.message || 'Track created successfully!',
          );
        }
      }
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to create track.');
    },
  });
};
