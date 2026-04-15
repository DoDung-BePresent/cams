import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { scheduleService } from '@/shared/modules/schedules/services';
import type { UpsertScheduleSlotRequest } from '@/shared/modules/schedules/types';
import { handleApiError } from '@/shared/utils';

type UpsertScheduleSlotInput = {
  slotId: string;
  body: UpsertScheduleSlotRequest;
};

export const useUpsertScheduleSlot = (spaceId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slotId, body }: UpsertScheduleSlotInput) => {
      if (!spaceId) {
        throw new Error('Space id is required');
      }
      return scheduleService.upsertSlot(spaceId, slotId, body);
    },
    onSuccess: async (response) => {
      message.success(response.data.message || 'Schedule slot saved.');
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.schedules.bootstrap(spaceId),
      });
    },
    onError: (error: unknown) => {
      handleApiError(error, {}, 'Failed to save schedule slot.');
    },
  });
};
