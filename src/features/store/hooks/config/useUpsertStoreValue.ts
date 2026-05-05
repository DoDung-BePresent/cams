import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { configService } from '@/features/store/services';
import {
  StoreOverrideIntentEnum,
  type UpsertStoreValueRequest,
} from '@/features/store/types';
import { useStoreContext } from '@/features/store/hooks';
import { handleApiError } from '@/shared/utils';

export const useUpsertStoreValue = () => {
  const queryClient = useQueryClient();
  const contextStoreId = useStoreContext();

  return useMutation({
    mutationFn: (request: UpsertStoreValueRequest) =>
      configService.upsertStoreValue({
        ...request,
        storeId: request.storeId ?? contextStoreId,
        overrideIntent: request.overrideIntent ?? StoreOverrideIntentEnum.None,
      }),
    onSuccess: (response) => {
      message.success(
        response.data.message || 'Store config value updated successfully!',
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.config.storeList(),
      });
    },
    onError: (error: unknown) => {
      handleApiError(error, {}, 'Failed to update store config value.');
    },
  });
};
