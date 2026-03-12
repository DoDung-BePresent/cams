import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { showErrorMessage } from '@/shared/utils/errorHandler';
import { playlistService } from '../services';

export const useTogglePlaylistStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => playlistService.toggleStatus(id),
    onSuccess: (response) => {
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['playlists'] });
        message.success(
          response.data.message || 'Playlist status updated successfully!',
        );
      }
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to update playlist status.');
    },
  });
};
