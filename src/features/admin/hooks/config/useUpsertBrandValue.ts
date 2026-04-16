import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { configService } from '@/features/admin/services';
import type { UpsertBrandValueRequest } from '@/features/admin/services/configService';
import { handleApiError } from '@/shared/utils';

export const useUpsertBrandValue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpsertBrandValueRequest) =>
      configService.upsertBrandValue(request),
    onSuccess: (response) => {
      message.success(
        response.data.message || 'Brand config value updated successfully!',
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.config.all });
    },
    onError: (error: unknown) => {
      handleApiError(error, {}, 'Failed to update brand config value.');
    },
  });
};
