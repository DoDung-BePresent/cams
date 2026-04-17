import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { configService } from '@/features/admin/services';
import type { UpsertStoreValueRequest } from '@/features/admin/services/configService';
import { handleApiError } from '@/shared/utils';

export const useUpsertStoreValue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpsertStoreValueRequest) =>
      configService.upsertStoreValue(request),
    onSuccess: (response) => {
      message.success(
        response.data.message || 'Store config value updated successfully!',
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.config.all });
    },
    onError: (error: unknown) => {
      handleApiError(error, {}, 'Failed to update store config value.');
    },
  });
};
