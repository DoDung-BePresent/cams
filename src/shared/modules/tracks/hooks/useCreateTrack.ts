import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

/**
 * Utils
 */
import { showErrorMessage } from '@/shared/utils';

/**
 * Services
 */
import { trackService } from '@/shared/modules/tracks/services';

/**
 * Types
 */
import type { CreateTrackRequest } from '@/shared/modules/tracks/types';

export const useCreateTrack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTrackRequest) => trackService.create(data),
    onSuccess: (response) => {
      if (response.data.isSuccess) {
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
