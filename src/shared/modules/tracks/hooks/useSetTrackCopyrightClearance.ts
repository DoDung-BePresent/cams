import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

/**
 * Utils
 */
import { showErrorMessage } from '@/shared/utils';

/**
 * Services
 */
import { trackService } from '@/shared/modules/tracks/services';

export const useSetTrackCopyrightClearance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      trackService.setCopyrightClearance(id, approve),
    onSuccess: (response, variables) => {
      if (response.data.isSuccess) {
        queryClient.invalidateQueries({ queryKey: ['tracks'] });
        queryClient.invalidateQueries({ queryKey: ['tracks', variables.id] });

        message.success(
          response.data.message ||
            (variables.approve
              ? 'Track approved successfully!'
              : 'Track rejected successfully!'),
        );
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      showErrorMessage(error, 'Failed to update copyright clearance.');
    },
  });
};
