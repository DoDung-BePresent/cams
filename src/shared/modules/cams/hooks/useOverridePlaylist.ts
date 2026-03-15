import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

/**
 * Utils
 */
import { handleApiError } from '@/shared/utils';

/**
 * Services
 */
import { camsService } from '@/shared/modules/cams/services';

/**
 * Types
 */
import type { OverridePlaylistRequest } from '@/shared/modules/cams/types';

/**
 * Constants
 */
import { CAMS_QUERY_KEYS } from '@/shared/modules/cams/constants';

/**
 * Override playlist for a space
 * Triggers backend to generate new HLS stream and broadcast via SignalR
 */
export const useOverridePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      spaceId,
      playlistId,
    }: {
      spaceId: string;
      playlistId: string;
    }) => {
      const data: OverridePlaylistRequest = { newPlaylistId: playlistId };
      return camsService.overridePlaylist(spaceId, data);
    },
    onSuccess: (_, variables) => {
      message.success('Playlist overridden successfully');
      // Invalidate space state to refetch
      queryClient.invalidateQueries({
        queryKey: [CAMS_QUERY_KEYS.SPACE_STATE, variables.spaceId],
      });
    },
    onError: (error: any) => {
      handleApiError(
        error,
        {},
        'Failed to override playlist. Please try again.',
      );
    },
  });
};
