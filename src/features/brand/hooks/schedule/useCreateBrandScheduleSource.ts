import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { scheduleService } from '@/features/brand/services';
import type { CreateBrandScheduleSourceRequest } from '@/features/brand/types';
import { handleApiError } from '@/shared/utils';

export const useCreateBrandScheduleSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateBrandScheduleSourceRequest) =>
      scheduleService.createSource(request),
    onSuccess: (response) => {
      message.success(
        response.data.message || 'Schedule source created successfully!',
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedules.brand });
    },
    onError: (error: unknown) => {
      handleApiError(error, {}, 'Failed to create schedule source.');
    },
  });
};
