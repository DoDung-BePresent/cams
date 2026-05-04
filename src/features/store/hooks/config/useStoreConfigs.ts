import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { QUERY_KEYS, STALE_TIME } from '@/config';
import { configService } from '@/features/store/services';
import type { ConfigStoreFilter } from '@/features/store/types';
import { useStoreContext } from '@/features/store/hooks';

export const useStoreConfigs = (filter: ConfigStoreFilter = {}) => {
  const contextStoreId = useStoreContext();
  const effectiveFilter = useMemo<ConfigStoreFilter>(
    () => ({
      ...filter,
      storeId: filter.storeId ?? contextStoreId,
    }),
    [contextStoreId, filter],
  );

  return useQuery({
    queryKey: QUERY_KEYS.config.storeList(
      effectiveFilter as Record<string, unknown>,
    ),
    queryFn: async () => {
      const response = await configService.getStoreList(effectiveFilter);
      return response.data;
    },
    enabled: !!effectiveFilter.storeId,
    staleTime: STALE_TIME.medium,
    placeholderData: (previousData) => previousData,
  });
};
