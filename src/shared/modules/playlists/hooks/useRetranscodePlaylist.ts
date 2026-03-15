import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

/**
 * Utils
 */
import { showErrorMessage } from '@/shared/utils';

/**
 * Services
 */
import { playlistService } from '@/shared/modules/playlists/services';

export const useRetranscodePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => playlistService.retranscode(id),
    onSuccess: (response) => {
      if (response.data.isSuccess) {
        queryClient.invalidateQueries({ queryKey: ['playlists'] });
        message.success(
          response.data.message || 'Retranscode job queued successfully!',
        );
      }
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to queue retranscode job.');
    },
  });
};
