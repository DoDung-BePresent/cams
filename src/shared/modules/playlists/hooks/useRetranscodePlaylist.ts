import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { showErrorMessage } from '@/shared/utils/errorHandler';
import { playlistService } from '../services';

export const useRetranscodePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => playlistService.retranscode(id),
    onSuccess: (response) => {
      if (response.data.success) {
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
