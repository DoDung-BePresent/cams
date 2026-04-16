import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { configService } from '@/features/brand/services';
import {
  BrandOverrideIntentEnum,
  type UpsertBrandValueRequest,
} from '@/features/brand/types';
import { handleApiError } from '@/shared/utils';

export const useUpsertBrandValue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpsertBrandValueRequest) =>
      configService.upsertBrandValue({
        ...request,
        overrideIntent: request.overrideIntent ?? BrandOverrideIntentEnum.None,
      }),
    onSuccess: (response) => {
      message.success(
        response.data.message || 'Brand config value updated successfully!',
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.config.brandList(),
      });
    },
    onError: (error: unknown) => {
      handleApiError(error, {}, 'Failed to update brand config value.');
    },
  });
};
