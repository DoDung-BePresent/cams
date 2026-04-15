import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { scheduleService } from '@/shared/modules/schedules/services';
import type { SaveScheduleToLibraryRequest } from '@/shared/modules/schedules/types';
import { handleApiError } from '@/shared/utils';

export const useSaveScheduleToLibrary = (spaceId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: SaveScheduleToLibraryRequest) => {
      if (!spaceId) {
        throw new Error('Space id is required');
      }
      return scheduleService.saveToLibrary(spaceId, body);
    },
    onSuccess: async (response) => {
      message.success(response.data.message || 'Schedule saved to library.');
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.schedules.bootstrap(spaceId),
      });
    },
    onError: (error: unknown) => {
      handleApiError(error, {}, 'Failed to save schedule to library.');
    },
  });
};
