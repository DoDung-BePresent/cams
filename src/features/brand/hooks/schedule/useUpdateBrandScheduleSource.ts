import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { scheduleService } from '@/features/brand/services';
import type { UpdateBrandScheduleSourceRequest } from '@/features/brand/types';
import { handleApiError } from '@/shared/utils';

export const useUpdateBrandScheduleSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sourceId,
      data,
    }: {
      sourceId: string;
      data: UpdateBrandScheduleSourceRequest;
    }) => scheduleService.updateSource(sourceId, data),
    onSuccess: (response) => {
      message.success(
        response.data.message || 'Schedule source updated successfully!',
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedules.brand });
    },
    onError: (error: unknown) => {
      handleApiError(error, {}, 'Failed to update schedule source.');
    },
  });
};
