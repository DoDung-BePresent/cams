import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { scheduleService } from '@/shared/modules/schedules/services';
import type { ApplyScheduleSourceRequest } from '@/shared/modules/schedules/types';
import { handleApiError } from '@/shared/utils';

export const useApplyScheduleSource = (spaceId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: ApplyScheduleSourceRequest) => {
      if (!spaceId) {
        throw new Error('Space id is required');
      }
      return scheduleService.applySource(spaceId, body);
    },
    onSuccess: async (response) => {
      message.success(response.data.message || 'Schedule source applied.');
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.schedules.bootstrap(spaceId),
      });
    },
    onError: (error: unknown) => {
      handleApiError(error, {}, 'Failed to apply schedule source.');
    },
  });
};
