import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { handleApiError } from '@/shared/utils/errorHandler';
import { ErrorCodeEnum } from '@/shared/types/errorTypes';
import { playlistService } from '../services';

export const useRemoveTrackFromPlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, trackId }: { id: string; trackId: string }) =>
      playlistService.removeTrack(id, trackId),
    onSuccess: (response) => {
      if (response.data.success) {
        queryClient.invalidateQueries({ queryKey: ['playlists'] });
        message.success(response.data.message || 'Track removed successfully!');
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
        'Failed to remove track from playlist.',
      );
    },
  });
};
