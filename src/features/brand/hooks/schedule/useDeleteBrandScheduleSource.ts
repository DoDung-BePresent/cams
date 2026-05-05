import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { scheduleService } from '@/features/brand/services';
import { handleApiError } from '@/shared/utils';

export const useDeleteBrandScheduleSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourceId: string) => scheduleService.deleteSource(sourceId),
    onSuccess: (response) => {
      message.success(
        response.data.message || 'Schedule source deleted successfully!',
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedules.brand });
    },
    onError: (error: unknown) => {
      handleApiError(error, {}, 'Failed to delete schedule source.');
    },
  });
};
