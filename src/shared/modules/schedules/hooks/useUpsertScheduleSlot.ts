import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { scheduleService } from '@/shared/modules/schedules/services';
import type { UpsertScheduleSlotRequest } from '@/shared/modules/schedules/types';
import { handleApiError } from '@/shared/utils';

type UpsertScheduleSlotInput = {
  slotId: string;
  body: UpsertScheduleSlotRequest;
  silent?: boolean;
};

export const useUpsertScheduleSlot = (spaceId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slotId, body, silent }: UpsertScheduleSlotInput) => {
      if (!spaceId) {
        throw new Error('Space id is required');
      }
      const response = await scheduleService.upsertSlot(spaceId, slotId, body);
      return { data: response.data, silent };
    },
    onMutate: async ({ slotId, body }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.schedules.bootstrap(spaceId),
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(
        QUERY_KEYS.schedules.bootstrap(spaceId),
      );

      // Optimistically update
      queryClient.setQueryData(
        QUERY_KEYS.schedules.bootstrap(spaceId),
        (old: unknown) => {
          if (!old || typeof old !== 'object') return old;
          const oldData = old as {
            draftSchedule?: { slots?: Array<{ id: string }> };
          };

          if (!oldData.draftSchedule?.slots) return old;

          return {
            ...oldData,
            draftSchedule: {
              ...oldData.draftSchedule,
              slots: oldData.draftSchedule.slots.map((slot) =>
                slot.id === slotId ? { ...slot, ...body } : slot,
              ),
            },
          };
        },
      );

      return { previousData };
    },
    onSuccess: async (result) => {
      if (!result.silent) {
        message.success(result.data.message || 'Schedule slot saved.');
      }
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.schedules.bootstrap(spaceId),
      });
    },
    onError: (error: unknown, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          QUERY_KEYS.schedules.bootstrap(spaceId),
          context.previousData,
        );
      }
      handleApiError(error, {}, 'Failed to save schedule slot.');
    },
  });
};
