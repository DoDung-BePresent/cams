import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useSignalR } from '@/shared/hooks';
import type {
  BrandDashboardChangedDto,
  BrandDashboardFilter,
} from '@/features/brand/types';
import {
  BRAND_DASHBOARD_QUERY_KEY,
  getBrandDashboardQueryKey,
} from './useBrandDashboard';

type UseBrandDashboardRealtimeOptions = {
  brandId?: string | null;
  filter?: BrandDashboardFilter;
  debounceMs?: number;
};

export const useBrandDashboardRealtime = ({
  brandId,
  filter = {},
  debounceMs = 800,
}: UseBrandDashboardRealtimeOptions) => {
  const queryClient = useQueryClient();
  const debounceRef = useRef<number | null>(null);
  const { connection, isConnected, error } = useSignalR('/hubs/store', {
    autoConnect: Boolean(brandId),
  });

  useEffect(() => {
    if (!connection || !isConnected || !brandId) return;

    connection
      .invoke('JoinBrandManagerRoomAsync', brandId)
      .catch((err) => console.error('Failed to join brand dashboard room:', err));
  }, [brandId, connection, isConnected]);

  useEffect(() => {
    if (!connection) return;

    const invalidateDashboard = (payload: BrandDashboardChangedDto) => {
      if (brandId && payload.brandId !== brandId) return;

      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }

      debounceRef.current = window.setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: getBrandDashboardQueryKey(filter),
        });
        queryClient.invalidateQueries({
          queryKey: [BRAND_DASHBOARD_QUERY_KEY],
        });
        debounceRef.current = null;
      }, debounceMs);
    };

    connection.on('BrandDashboardChanged', invalidateDashboard);

    return () => {
      connection.off('BrandDashboardChanged', invalidateDashboard);
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [brandId, connection, debounceMs, filter, queryClient]);

  return {
    isConnected,
    error,
  };
};
