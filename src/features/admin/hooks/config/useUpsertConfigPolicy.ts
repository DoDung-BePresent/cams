import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { configService } from '@/features/admin/services';
import type { UpsertPolicyRequest } from '@/features/admin/types';
import { handleApiError } from '@/shared/utils';

export const useUpsertConfigPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpsertPolicyRequest) =>
      configService.upsertPolicy(request),
    onSuccess: (response) => {
      message.success(
        response.data.message || 'Config policy updated successfully!',
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.config.all });
    },
    onError: (error: unknown) => {
      handleApiError(error, {}, 'Failed to update config policy.');
    },
  });
};
