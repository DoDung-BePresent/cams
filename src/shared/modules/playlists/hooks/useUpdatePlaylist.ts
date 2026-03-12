import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { showErrorMessage } from '@/shared/utils/errorHandler';
import { playlistService } from '../services';
import type { UpdatePlaylistRequest } from '../types';

export const useUpdatePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlaylistRequest }) =>
      playlistService.update(id, data),
    onSuccess: (response) => {
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['playlists'] });
        message.success(
          response.data.message || 'Playlist updated successfully!',
        );
      }
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to update playlist.');
    },
  });
};
