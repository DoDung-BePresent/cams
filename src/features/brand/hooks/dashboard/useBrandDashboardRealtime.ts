import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/providers';
import { useStoreHub } from '@/shared/modules/cams/hooks';
import { storeHubService } from '@/shared/modules/cams/services';
import type { PlayStreamPayload } from '@/shared/modules/cams/types';
import type { BrandDashboardFilter } from '@/features/brand/types';

type UseBrandDashboardRealtimeOptions = {
  brandId?: string | null;
  filter?: BrandDashboardFilter;
  activeSpaceId?: string | null;
  activeStoreId?: string | null;
  debounceMs?: number;
};

const getSpaceStateQueryKey = (spaceId: string) => [
  'cams-space-state',
  spaceId,
];

const getPayloadSpaceId = (
  payload:
    | (Partial<PlayStreamPayload> & { SpaceId?: string })
    | { spaceId?: string; SpaceId?: string }
    | null
    | undefined,
) => payload?.spaceId ?? payload?.SpaceId ?? null;

export const useBrandDashboardRealtime = ({
  brandId,
  activeSpaceId,
  activeStoreId,
}: UseBrandDashboardRealtimeOptions) => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const activeSpaceIdRef = useRef<string | null | undefined>(activeSpaceId);
  const joinedSpaceIdRef = useRef<string | null>(null);
  const { isConnected, error } = useStoreHub(
    activeStoreId ?? null,
    accessToken,
    {
      onSpaceStateSync: (spaceId, state) => {
        const activeRoomId = activeSpaceIdRef.current;
        if (!activeRoomId || spaceId !== activeRoomId) return;
        if (brandId && state.brandId && state.brandId !== brandId) return;

        console.info(
          '[BrandDashboardRealtime] SpaceStateSync received',
          state.spaceId,
          state.currentTrackName,
        );
        queryClient.setQueryData(getSpaceStateQueryKey(spaceId), state);
      },
      onPlayStream: (payload) => {
        const activeRoomId = activeSpaceIdRef.current;
        const payloadSpaceId = getPayloadSpaceId(payload);
        if (!activeRoomId || payloadSpaceId !== activeRoomId) return;

        console.info(
          '[BrandDashboardRealtime] PlayStream received for active space',
          activeRoomId,
        );
        queryClient.invalidateQueries({
          queryKey: getSpaceStateQueryKey(activeRoomId),
        });
      },
      onReconnected: () => {
        const activeRoomId = activeSpaceIdRef.current;
        if (!activeRoomId) return;

        queryClient.invalidateQueries({
          queryKey: getSpaceStateQueryKey(activeRoomId),
        });
      },
    },
  );

  useEffect(() => {
    activeSpaceIdRef.current = activeSpaceId;
  }, [activeSpaceId]);

  useEffect(() => {
    if (!isConnected || !activeSpaceId) return;

    let cancelled = false;

    storeHubService
      .joinSpace(activeSpaceId)
      .then(() => {
        if (cancelled) {
          storeHubService
            .leaveSpace(activeSpaceId)
            .catch((err) =>
              console.warn(
                '[BrandDashboardRealtime] Failed to leave stale active space room:',
                err,
              ),
            );
          return;
        }

        joinedSpaceIdRef.current = activeSpaceId;
        console.info(
          '[BrandDashboardRealtime] Joined active space room',
          activeSpaceId,
        );
        queryClient.invalidateQueries({
          queryKey: getSpaceStateQueryKey(activeSpaceId),
        });
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn(
            '[BrandDashboardRealtime] Failed to join active space room:',
            err,
          );
        }
      });

    return () => {
      cancelled = true;

      if (joinedSpaceIdRef.current !== activeSpaceId) return;

      joinedSpaceIdRef.current = null;
      console.info(
        '[BrandDashboardRealtime] Leaving active space room',
        activeSpaceId,
      );
      storeHubService
        .leaveSpace(activeSpaceId)
        .catch((err) =>
          console.warn(
            '[BrandDashboardRealtime] Failed to leave active space room:',
            err,
          ),
        );
    };
  }, [activeSpaceId, isConnected, queryClient]);

  return {
    isConnected,
    error,
  };
};
