import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { scheduleService } from '@/features/brand/services';
import type { UpsertBrandScheduleSlotRequest } from '@/features/brand/types';
import { handleApiError } from '@/shared/utils';

type UpsertBrandScheduleSlotPayload = {
  sourceId: string;
  slotId: string;
  body: UpsertBrandScheduleSlotRequest;
};

export const useUpsertBrandScheduleSlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceId, slotId, body }: UpsertBrandScheduleSlotPayload) =>
      scheduleService.upsertSlot(sourceId, slotId, body),
    onSuccess: (response) => {
      message.success(
        response.data.message || 'Schedule slot saved successfully!',
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedules.brand });
    },
    onError: (error: unknown) => {
      handleApiError(error, {}, 'Failed to save schedule slot.');
    },
  });
};
