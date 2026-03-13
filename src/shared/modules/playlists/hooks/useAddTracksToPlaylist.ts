import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

/**
 * Utils
 */
import { handleApiError } from '@/shared/utils';

/**
 * Types
 */
import { ErrorCodeEnum } from '@/shared/types';
import type { AddTracksToPlaylistRequest } from '@/shared/modules/playlists/types';

/**
 * Services
 */
import { playlistService } from '@/shared/modules/playlists/services';

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
      if (response.data.isSuccess) {
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
