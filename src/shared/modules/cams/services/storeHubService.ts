import * as signalR from '@microsoft/signalr';
import { getSignalRUrl } from '@/config';
import { STORE_HUB_URL, STORE_HUB_EVENTS } from '../constants';
import type {
  PlayStreamPayload,
  PlaybackStateChangedPayload,
  SpaceStateDto,
} from '../types';

/**
 * Event handlers type
 */
type EventHandlers = {
  onPlayStream?: (payload: PlayStreamPayload) => void;
  onPlaybackStateChanged?: (payload: PlaybackStateChangedPayload) => void;
  onSpaceStateSync?: (spaceId: string, state: SpaceStateDto) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onReconnecting?: () => void;
  onReconnected?: () => void;
};

/**
 * SignalR StoreHub Service
 * Handles real-time communication with backend for CAMS
 */
class StoreHubService {
  private connection: signalR.HubConnection | null = null;
  private handlers: EventHandlers = {};
  private storeId: string | null = null;

  /**
   * Initialize connection
   */
  async connect(storeId: string, token: string, handlers: EventHandlers = {}) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.warn('⚠️ StoreHub already connected');
      return;
    }

    this.storeId = storeId;
    this.handlers = handlers;

    // Build full Hub URL
    const baseUrl = getSignalRUrl();
    const hubUrl = `${baseUrl}${STORE_HUB_URL}`;

    console.log('🔌 Connecting to StoreHub:', {
      baseUrl,
      hubUrl,
      storeId,
      hasToken: !!token,
    });

    // Build connection
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 0s, 2s, 10s, 30s
          if (retryContext.previousRetryCount === 0) return 0;
          if (retryContext.previousRetryCount === 1) return 2000;
          if (retryContext.previousRetryCount === 2) return 10000;
          return 30000;
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Register event handlers
    this.registerEventHandlers();

    // Connection lifecycle events
    this.connection.onreconnecting((error) => {
      console.log('🔄 StoreHub reconnecting...', error);
      this.handlers.onReconnecting?.();
    });

    this.connection.onreconnected(async (connectionId) => {
      console.log('✅ StoreHub reconnected:', connectionId);
      // Rejoin store group
      if (this.storeId) {
        await this.joinStore(this.storeId);
      }
      this.handlers.onReconnected?.();
    });

    this.connection.onclose((error) => {
      console.log('❌ StoreHub disconnected', error);
      this.handlers.onDisconnected?.();
    });

    // Start connection
    try {
      await this.connection.start();
      console.log('✅ StoreHub connected successfully');

      // Join store group
      await this.joinStore(storeId);

      this.handlers.onConnected?.();
    } catch (error) {
      console.error('❌ Failed to connect to StoreHub:', error);
      throw error;
    }
  }

  /**
   * Register SignalR event handlers
   */
  private registerEventHandlers() {
    if (!this.connection) return;

    // PlayStream event (§ 1.1)
    this.connection.on(
      STORE_HUB_EVENTS.PLAY_STREAM,
      (payload: PlayStreamPayload) => {
        console.log('🎵 PlayStream event:', payload);
        this.handlers.onPlayStream?.(payload);
      },
    );

    // PlaybackStateChanged event (§ 1.2)
    this.connection.on(
      STORE_HUB_EVENTS.PLAYBACK_STATE_CHANGED,
      (payload: PlaybackStateChangedPayload) => {
        console.log('⏯️ PlaybackStateChanged event:', payload);
        this.handlers.onPlaybackStateChanged?.(payload);
      },
    );

    // SpaceStateSync event (§ 1.3)
    this.connection.on(
      STORE_HUB_EVENTS.SPACE_STATE_SYNC,
      (spaceId: string, state: SpaceStateDto) => {
        console.log('🔄 SpaceStateSync event:', spaceId, state);
        this.handlers.onSpaceStateSync?.(spaceId, state);
      },
    );
  }

  /**
   * Join store group (§ 2.1)
   */
  private async joinStore(storeId: string) {
    if (!this.connection) throw new Error('Connection not initialized');

    try {
      await this.connection.invoke(STORE_HUB_EVENTS.JOIN_STORE, storeId);
      console.log(`✅ Joined store group: ${storeId}`);
    } catch (error) {
      console.error('❌ Failed to join store:', error);
      throw error;
    }
  }

  /**
   * Leave store group (§ 2.2)
   */
  async leaveStore() {
    if (!this.connection || !this.storeId) return;

    try {
      await this.connection.invoke(STORE_HUB_EVENTS.LEAVE_STORE, this.storeId);
      console.log(`👋 Left store group: ${this.storeId}`);
    } catch (error) {
      console.error('❌ Failed to leave store:', error);
    }
  }

  /**
   * Update space music state (§ 2.3)
   */
  async updateSpaceMusicState(state: SpaceStateDto) {
    if (!this.connection) throw new Error('Connection not initialized');

    try {
      await this.connection.invoke(
        STORE_HUB_EVENTS.UPDATE_SPACE_MUSIC_STATE,
        state,
      );
      console.log('✅ Updated space music state:', state);
    } catch (error) {
      console.error('❌ Failed to update space music state:', error);
      throw error;
    }
  }

  /**
   * Get space current state (§ 2.4)
   */
  async getSpaceCurrentState(spaceId: string): Promise<SpaceStateDto | null> {
    if (!this.connection) throw new Error('Connection not initialized');

    try {
      const state = await this.connection.invoke<SpaceStateDto | null>(
        STORE_HUB_EVENTS.GET_SPACE_CURRENT_STATE,
        spaceId,
      );
      console.log('📊 Got space state:', state);
      return state;
    } catch (error) {
      console.error('❌ Failed to get space state:', error);
      throw error;
    }
  }

  /**
   * Get all spaces state in store (§ 2.5)
   */
  async getStoreSpacesState(): Promise<SpaceStateDto[]> {
    if (!this.connection) throw new Error('Connection not initialized');

    try {
      const states = await this.connection.invoke<SpaceStateDto[]>(
        STORE_HUB_EVENTS.GET_STORE_SPACES_STATE,
      );
      console.log('📊 Got store spaces state:', states);
      return states;
    } catch (error) {
      console.error('❌ Failed to get store spaces state:', error);
      throw error;
    }
  }

  /**
   * Disconnect from hub
   */
  async disconnect() {
    if (!this.connection) return;

    try {
      await this.leaveStore();
      await this.connection.stop();
      console.log('👋 StoreHub disconnected gracefully');
    } catch (error) {
      console.error('❌ Failed to disconnect from StoreHub:', error);
    } finally {
      this.connection = null;
      this.storeId = null;
    }
  }

  /**
   * Get connection state
   */
  getState(): signalR.HubConnectionState {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

// Export singleton instance
export const storeHubService = new StoreHubService();
