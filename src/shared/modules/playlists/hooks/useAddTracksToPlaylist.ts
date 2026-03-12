import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { handleApiError } from '@/shared/utils/errorHandler';
import { ErrorCodeEnum } from '@/shared/types/errorTypes';
import { playlistService } from '../services';
import type { AddTracksToPlaylistRequest } from '../types';

export const useAddTracksToPlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: AddTracksToPlaylistRequest;
    }) => playlistService.addTracks(id, data),
    onSuccess: (response) => {
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['playlists'] });
        message.success(response.data.message || 'Tracks added successfully!');
      }
    },
    onError: (error: any) => {
      handleApiError(
        error,
        {
          [ErrorCodeEnum.BusinessRuleViolation]: () => {
            message.error('Cannot modify playlist while actively streaming.');
          },
        },
        'Failed to add tracks to playlist.',
      );
    },
  });
};
