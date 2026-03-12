import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { showErrorMessage } from '@/shared/utils';
import { playlistService } from '../services';
import type { CreatePlaylistRequest } from '../types';

export const useCreatePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlaylistRequest) => playlistService.create(data),
    onSuccess: (response) => {
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['playlists'] });
        message.success(
          response.data.message || 'Playlist created successfully!',
        );
      }
    },
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to create playlist.');
    },
  });
};
