import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { scheduleService } from '@/shared/modules/schedules/services';
import { handleApiError } from '@/shared/utils';

export const useDeleteScheduleSlot = (spaceId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slotId: string) => {
      if (!spaceId) {
        throw new Error('Space id is required');
      }
      return scheduleService.deleteSlot(spaceId, slotId);
    },
    onSuccess: async (response) => {
      message.success(response.data.message || 'Schedule slot removed.');
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.schedules.bootstrap(spaceId),
      });
    },
    onError: (error: unknown) => {
      handleApiError(error, {}, 'Failed to remove schedule slot.');
    },
  });
};
