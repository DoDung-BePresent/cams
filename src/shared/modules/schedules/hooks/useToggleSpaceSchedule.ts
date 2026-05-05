import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { scheduleService } from '@/shared/modules/schedules/services';
import type { ToggleSpaceScheduleRequest } from '@/shared/modules/schedules/types';
import { handleApiError } from '@/shared/utils';

export const useToggleSpaceSchedule = (spaceId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: ToggleSpaceScheduleRequest) => {
      if (!spaceId) {
        throw new Error('Space id is required');
      }
      return scheduleService.toggle(spaceId, body);
    },
    onSuccess: async (response) => {
      message.success(response.data.message || 'Schedule status updated.');
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.schedules.bootstrap(spaceId),
      });
    },
    onError: (error: unknown) => {
      handleApiError(error, {}, 'Failed to update schedule status.');
    },
  });
};
