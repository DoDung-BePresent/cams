import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { scheduleService } from '@/features/brand/services';
import { handleApiError } from '@/shared/utils';

type DeleteBrandScheduleSlotPayload = {
  sourceId: string;
  slotId: string;
};

export const useDeleteBrandScheduleSlot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceId, slotId }: DeleteBrandScheduleSlotPayload) =>
      scheduleService.deleteSlot(sourceId, slotId),
    onSuccess: (response) => {
      message.success(
        response.data.message || 'Schedule slot deleted successfully!',
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedules.brand });
    },
    onError: (error: unknown) => {
      handleApiError(error, {}, 'Failed to delete schedule slot.');
    },
  });
};
