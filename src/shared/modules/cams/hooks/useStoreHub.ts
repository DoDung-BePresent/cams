import { useEffect, useRef, useState } from 'react';
import { message } from 'antd';

/**
 * Services
 */
import { storeHubService } from '@/shared/modules/cams/services';

/**
 * Types
 */
import type {
  PlayStreamPayload,
  PlaybackStateChangedPayload,
  SpaceStateDto,
} from '@/shared/modules/cams/types';

/**
 * Event handlers for SignalR events
 */
type StoreHubEventHandlers = {
  onPlayStream?: (payload: PlayStreamPayload) => void;
  onPlaybackStateChanged?: (payload: PlaybackStateChangedPayload) => void;
  onSpaceStateSync?: (spaceId: string, state: SpaceStateDto) => void;
};

/**
 * Hook to manage SignalR connection to StoreHub
 * Auto-connects when storeId is available
 * Auto-disconnects on unmount
 */
export const useStoreHub = (
  storeId: string | null | undefined,
  token: string | null | undefined,
  handlers: StoreHubEventHandlers = {},
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const handlersRef = useRef(handlers);

  // Update handlers ref without triggering reconnection
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    // Don't connect if no storeId or token
    if (!storeId || !token) {
      setIsConnected(false);
      return;
    }

    let mounted = true;

    const connect = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        await storeHubService.connect(storeId, token, {
          onPlayStream: (payload) =>
            handlersRef.current.onPlayStream?.(payload),
          onPlaybackStateChanged: (payload) =>
            handlersRef.current.onPlaybackStateChanged?.(payload),
          onSpaceStateSync: (spaceId, state) =>
            handlersRef.current.onSpaceStateSync?.(spaceId, state),
          onConnected: () => {
            if (mounted) {
              setIsConnected(true);
              setIsConnecting(false);
              console.log('✅ StoreHub connected');
            }
          },
          onDisconnected: () => {
            if (mounted) {
              setIsConnected(false);
              setIsConnecting(false);
              console.log('❌ StoreHub disconnected');
            }
          },
          onReconnecting: () => {
            if (mounted) {
              setIsConnected(false);
              setIsConnecting(true);
              console.log('🔄 StoreHub reconnecting...');
            }
          },
          onReconnected: () => {
            if (mounted) {
              setIsConnected(true);
              setIsConnecting(false);
              message.success('Reconnected to music system');
              console.log('✅ StoreHub reconnected');
            }
          },
        });
      } catch (err) {
        if (mounted) {
          const error = err as Error;
          setError(error);
          setIsConnecting(false);
          message.error('Failed to connect to music system');
          console.error('StoreHub connection error:', error);
        }
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      mounted = false;
      storeHubService.disconnect();
    };
  }, [storeId, token]);

  return {
    isConnected,
    isConnecting,
    error,
  };
};
