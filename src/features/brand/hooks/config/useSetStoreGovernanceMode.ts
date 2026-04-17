import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import { QUERY_KEYS } from '@/config';
import { configService } from '@/features/brand/services';
import type { SetStoreGovernanceModeRequest } from '@/features/brand/types';
import { handleApiError } from '@/shared/utils';

export const useSetStoreGovernanceMode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SetStoreGovernanceModeRequest) =>
      configService.setStoreGovernanceMode(request),
    onSuccess: (response) => {
      message.success(
        response.data.message || 'Governance mode updated successfully!',
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stores.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.config.storeList(),
      });
    },
    onError: (error: unknown) => {
      handleApiError(error, {}, 'Failed to update governance mode.');
    },
  });
};
