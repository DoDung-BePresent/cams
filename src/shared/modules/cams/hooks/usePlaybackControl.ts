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
 * Constants
 */
import {
  CAMS_QUERY_KEYS,
  PLAYBACK_COMMAND_LABELS,
} from '@/shared/modules/cams/constants';

/**
 * Types
 */
import type {
  PlaybackCommand,
  PlaybackControlRequest,
} from '@/shared/modules/cams/types';

/**
 * Control playback for a space
 * Commands: Pause, Resume, SkipToNext, SkipToPrevious
 */
export const usePlaybackControl = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      spaceId,
      command,
    }: {
      spaceId: string;
      command: PlaybackCommand;
    }) => {
      const data: PlaybackControlRequest = { command };
      return camsService.controlPlayback(spaceId, data);
    },
    onSuccess: (_, variables) => {
      const commandLabel = PLAYBACK_COMMAND_LABELS[variables.command];
      message.success(`${commandLabel} command sent`);
      // Invalidate space state
      queryClient.invalidateQueries({
        queryKey: [CAMS_QUERY_KEYS.SPACE_STATE, variables.spaceId],
      });
    },
    onError: (error: any) => {
      handleApiError(
        error,
        {},
        'Failed to control playback. Please try again.',
      );
    },
  });
};
