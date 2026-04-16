import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { handleApiError } from '@/shared/utils';
import { camsService } from '../services';
import type { UpdateSchedulingStateRequest } from '../types';

export const useUpdateSchedulingState = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      spaceId,
      data,
    }: {
      spaceId: string;
      data: UpdateSchedulingStateRequest;
    }) => camsService.updateSchedulingState(spaceId, data),
    onSuccess: (_response, variables) => {
      message.success(
        variables.data.isScheduling
          ? 'Scheduling mode activated'
          : 'Returned to normal mode',
      );
      queryClient.invalidateQueries({
        queryKey: ['cams-space-state', variables.spaceId],
      });
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};
