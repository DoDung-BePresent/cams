import { useEffect, useState } from 'react';
import { Drawer, Typography, Spin } from 'antd';
import { SpacePlayerCard } from './SpacePlayerCard';
import { useStoreHub } from '@/shared/modules/cams/hooks';
import { useAuth } from '@/providers';
import { storeHubService } from '@/shared/modules/cams/services';
import { useQueryClient } from '@tanstack/react-query';
import { useSpace } from '@/features/store/hooks';
import type { SpaceStateDto } from '@/shared/modules/cams/types';

const { Title } = Typography;

interface SpaceMusicDrawerProps {
  open: boolean;
  spaceId: string | null;
  storeId: string;
  onClose: () => void;
}

/**
 * SpaceMusicDrawer - Manages music playback for a single space
 *
 * This component:
 * 1. Joins the specific space group via SignalR (JoinSpaceAsync)
 * 2. Listens for SpaceStateSync events for real-time updates
 * 3. Renders SpacePlayerCard for music control
 * 4. Leaves the space group when closed
 */
export const SpaceMusicDrawer = ({
  open,
  spaceId,
  storeId,
  onClose,
}: SpaceMusicDrawerProps) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [isJoinedSpace, setIsJoinedSpace] = useState(false);

  // Fetch space data
  const { data: space, isLoading: isLoadingSpace } = useSpace(
    spaceId || undefined,
    open && !!spaceId,
  );

  // Connect to StoreHub (manager room)
  const { isConnected } = useStoreHub(storeId, accessToken, {
    onSpaceStateSync: (syncedSpaceId: string, state: SpaceStateDto) => {
      console.log('🔄 SpaceMusicDrawer received SpaceStateSync:', {
        syncedSpaceId,
        currentSpaceId: spaceId,
        isJoinedSpace,
        state,
      });

      // Only update if this is the space we're managing
      if (syncedSpaceId === spaceId) {
        console.log('✅ Invalidating space state query to trigger refetch');

        // Invalidate the query to trigger a refetch
        // Query key must match useSpaceState: ['cams-space-state', spaceId]
        queryClient.invalidateQueries({
          queryKey: ['cams-space-state', spaceId],
          refetchType: 'active', // Only refetch if query is currently active
        });
      }
    },
  });

  // Join/leave specific space group when drawer opens/closes
  useEffect(() => {
    if (!open || !spaceId || !isConnected) {
      return;
    }

    console.log('🎵 Joining space group:', spaceId);

    let joined = false;

    // Join the specific space group
    storeHubService
      .joinSpace(spaceId)
      .then(() => {
        console.log('✅ Joined space group successfully:', spaceId);
        joined = true;
        setIsJoinedSpace(true);
      })
      .catch((error) => {
        console.error('❌ Failed to join space group:', error);
      });

    // Leave space group on cleanup
    return () => {
      console.log('👋 Leaving space group:', spaceId);
      if (joined) {
        setIsJoinedSpace(false);
      }
      storeHubService
        .leaveSpace(spaceId)
        .then(() => {
          console.log('✅ Left space group successfully:', spaceId);
        })
        .catch((error) => {
          console.error('❌ Failed to leave space group:', error);
        });
    };
  }, [open, spaceId, isConnected]);

  return (
    <Drawer
      title={
        <Title level={4}>
          Manage Music -{' '}
          {isLoadingSpace ? 'Loading...' : space?.name || 'Unknown'}
        </Title>
      }
      open={open}
      onClose={onClose}
      width={600}
      destroyOnClose
    >
      {isLoadingSpace ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size='large' />
        </div>
      ) : !isJoinedSpace ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin
            size='large'
            tip='Connecting to space...'
          />
        </div>
      ) : spaceId && space ? (
        <SpacePlayerCard
          space={space}
          storeId={storeId}
        />
      ) : null}
    </Drawer>
  );
};
