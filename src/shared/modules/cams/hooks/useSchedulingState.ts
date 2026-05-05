import { useMutation, useQueryClient } from '@tanstack/react-query';
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
      queryClient.invalidateQueries({
        queryKey: ['cams-space-state', variables.spaceId],
      });
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};
