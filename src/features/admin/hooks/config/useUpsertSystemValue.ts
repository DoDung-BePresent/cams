import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { configService } from '@/features/admin/services';
import type { UpsertSystemValueRequest } from '@/features/admin/types';
import { handleApiError } from '@/shared/utils';

export const useUpsertSystemValue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpsertSystemValueRequest) =>
      configService.upsertSystemValue(request),
    onSuccess: (response) => {
      message.success(
        response.data.message || 'System config value updated successfully!',
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.config.all });
    },
    onError: (error: unknown) => {
      handleApiError(error, {}, 'Failed to update system config value.');
    },
  });
};
