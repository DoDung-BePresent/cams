import { useState, useCallback, useRef } from 'react';
import {
  Card,
  Button,
  Space,
  Select,
  Typography,
  Divider,
  Flex,
  message,
  Tag,
} from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import {
  SpacePlayer,
  AIExplainabilityPanel,
  QueueList,
} from '@/shared/modules/cams/components';
import {
  useSpaceState,
  usePlaybackControl,
  useOverridePlaylist,
  useUpdateAudioState,
} from '@/shared/modules/cams/hooks';
import {
  PlaybackCommand,
  QueueItemSource,
  QueueItemStatus,
  QueueEndBehavior,
} from '@/shared/modules/cams/types';
import type { SpaceQueueItemResponse } from '@/shared/modules/cams/types';
import { isSpacePlaying } from '@/shared/modules/cams/utils';
import { usePlaylists } from '@/shared/modules/playlists/hooks';
import type { SpaceListItem } from '@/shared/modules/spaces/types';

const { Title, Text } = Typography;

interface SpacePlayerCardProps {
  space: SpaceListItem;
  storeId: string;
}

export const SpacePlayerCard = ({ space, storeId }: SpacePlayerCardProps) => {
  const [showSettings, setShowSettings] = useState(false);

  // Fetch space state from API (initial load only)
  const { data: spaceState, isLoading: isLoadingState } = useSpaceState(
    space.id,
    true,
  );

  console.log(spaceState);

  // ✅ Use spaceState directly - no need for intermediate state
  // The component will re-render when spaceState changes from React Query

  // Fetch available playlists for this store
  const { data: playlistsData } = usePlaylists({
    page: 1,
    pageSize: 100,
    status: 1,
    storeId,
  });

  // Mutations
  const playbackControl = usePlaybackControl();
  const overridePlaylist = useOverridePlaylist();
  const updateAudio = useUpdateAudioState();

  // Debounce ref for volume updates
  const volumeUpdateTimeoutRef = useRef<number | null>(null);

  // ✅ Use spaceState directly from React Query
  const hlsUrl = spaceState?.hlsUrl || null;
  const hasActiveTrack = !!spaceState?.currentQueueItemId;
  const isPending = !!spaceState?.pendingQueueItemId;
  const rawQueue = spaceState?.spaceQueueItems || [];
  // queue presence is derived where needed

  // ✅ Calculate if currently playing - prioritize isPaused flag from server
  const isPlaying = spaceState
    ? !spaceState.isPaused && isSpacePlaying(spaceState)
    : false;

  // Normalize queue items: accept either `position` or `orderIndex`, accept optional queueStatus from server
  const normalizedQueue = (
    rawQueue as Array<
      Partial<SpaceQueueItemResponse> & {
        orderIndex?: number;
        queueStatus?: number;
      }
    >
  ).map((item) => {
    const position = item.position ?? item.orderIndex ?? 0;
    const rawStatus =
      typeof item.queueStatus === 'number' ? item.queueStatus : undefined;
    return {
      queueItemId: item.queueItemId,
      trackId: item.trackId ?? null,
      trackName: item.trackName || 'Unknown',
      position,
      rawStatus,
      source: QueueItemSource.AI,
      hlsUrl: item.hlsUrl ?? null,
      isReadyToStream: !!item.hlsUrl,
      coverImageUrl: item.coverImageUrl ?? null,
    } as Partial<SpaceQueueItemResponse & { rawStatus?: number }>;
  });

  // Sort by position
  const sortedByPosition = [...normalizedQueue].sort(
    (a, b) => (a.position! as number) - (b.position! as number),
  );

  // Determine current item position (if any)
  const currentItem = sortedByPosition.find(
    (i) => i.queueItemId === spaceState?.currentQueueItemId,
  ) || { position: 0 };

  // Map to full SpaceQueueItemResponse with proper queueStatus mapping
  const queueItems: SpaceQueueItemResponse[] = sortedByPosition.map((i) => {
    const position = i.position ?? 0;
    let queueStatus: QueueItemStatus;

    if (typeof i.rawStatus === 'number') {
      queueStatus = i.rawStatus as QueueItemStatus;
    } else if (i.queueItemId === spaceState?.currentQueueItemId) {
      queueStatus = QueueItemStatus.Playing;
    } else if (i.queueItemId === spaceState?.pendingQueueItemId) {
      queueStatus = QueueItemStatus.Pending;
    } else if (position < (currentItem.position ?? 0)) {
      queueStatus = QueueItemStatus.Played;
    } else {
      queueStatus = QueueItemStatus.Pending;
    }

    return {
      queueItemId: i.queueItemId!,
      trackId: i.trackId ?? '',
      trackName: i.trackName ?? 'Unknown',
      position: position as number,
      queueStatus,
      source: i.source ?? QueueItemSource.AI,
      hlsUrl: i.hlsUrl ?? null,
      isReadyToStream: !!i.hlsUrl,
      coverImageUrl: i.coverImageUrl ?? null,
    } as SpaceQueueItemResponse;
  });

  // Playback control handlers
  const handlePlayPause = useCallback(() => {
    if (!hasActiveTrack) {
      message.warning('Please select a playlist first');
      return;
    }

    if (isPending) {
      message.info('Playlist is being prepared. Please wait...');
      return;
    }

    // Toggle based on current playing state
    const command = isPlaying ? PlaybackCommand.Pause : PlaybackCommand.Resume;

    playbackControl.mutate({
      spaceId: space.id,
      command,
    });
  }, [space.id, isPlaying, hasActiveTrack, isPending, playbackControl]);

  const handleSkipNext = useCallback(() => {
    if (isPending) {
      message.info('Playlist is being prepared. Please wait...');
      return;
    }
    playbackControl.mutate({
      spaceId: space.id,
      command: PlaybackCommand.SkipNext,
    });
  }, [space.id, isPending, playbackControl]);

  const handleSkipPrevious = useCallback(() => {
    if (isPending) {
      message.info('Playlist is being prepared. Please wait...');
      return;
    }

    // Attempt to jump to previous track (always jump when available).
    // Find previous item by position
    const currentPos = currentItem.position ?? 0;
    const previous = queueItems
      .filter((it) => it.position < currentPos)
      .sort((a, b) => b.position - a.position)[0];

    if (previous && previous.trackId) {
      // Use SkipToTrack to explicitly jump to previous track
      playbackControl.mutate({
        spaceId: space.id,
        command: PlaybackCommand.SkipToTrack,
        targetTrackId: previous.trackId,
      });
      return;
    }

    // Fallback: no previous found — send regular SkipPrevious
    playbackControl.mutate({
      spaceId: space.id,
      command: PlaybackCommand.SkipPrevious,
    });
  }, [space.id, isPending, playbackControl, currentItem.position, queueItems]);

  const handleSkipToTrack = useCallback(
    (_queueItemId: string, trackId?: string) => {
      if (isPending) {
        message.info('Playlist is being prepared. Please wait...');
        return;
      }

      if (!trackId) {
        message.warning('Track not available');
        return;
      }

      playbackControl.mutate({
        spaceId: space.id,
        command: PlaybackCommand.SkipToTrack,
        targetTrackId: trackId,
      });
    },
    [space.id, isPending, playbackControl],
  );

  // Seek (absolute) from player slider (debounced on after-change)
  const handleSeek = useCallback(
    (seconds: number) => {
      if (isPending) {
        message.info('Playlist is being prepared. Please wait...');
        return;
      }

      playbackControl.mutate({
        spaceId: space.id,
        command: PlaybackCommand.Seek,
        seekPositionSeconds: Math.max(0, Math.floor(seconds)),
      });
    },
    [space.id, isPending, playbackControl],
  );

  const handleRewind10 = useCallback(() => {
    if (isPending) {
      message.info('Playlist is being prepared. Please wait...');
      return;
    }
    playbackControl.mutate({
      spaceId: space.id,
      command: PlaybackCommand.SeekBackward,
      seekPositionSeconds: 10,
    });
  }, [space.id, isPending, playbackControl]);

  const handleForward10 = useCallback(() => {
    if (isPending) {
      message.info('Playlist is being prepared. Please wait...');
      return;
    }
    playbackControl.mutate({
      spaceId: space.id,
      command: PlaybackCommand.SeekForward,
      seekPositionSeconds: 10,
    });
  }, [space.id, isPending, playbackControl]);

  // Volume / Mute / Queue behavior handlers
  const handleVolumeChangeBackend = useCallback(
    (volume: number) => {
      if (volumeUpdateTimeoutRef.current) {
        clearTimeout(volumeUpdateTimeoutRef.current);
        volumeUpdateTimeoutRef.current = null;
      }
      volumeUpdateTimeoutRef.current = window.setTimeout(() => {
        updateAudio.mutate({
          spaceId: space.id,
          data: {
            volumePercent: Math.max(0, Math.min(100, Math.floor(volume))),
          },
        });
        volumeUpdateTimeoutRef.current = null;
      }, 400);
    },
    [space.id, updateAudio],
  );

  const handleToggleMute = useCallback(() => {
    updateAudio.mutate({
      spaceId: space.id,
      data: { isMuted: !spaceState?.isMuted },
    });
  }, [space.id, spaceState?.isMuted, updateAudio]);

  const handleQueueEndBehaviorChange = useCallback(
    (value: QueueEndBehavior) => {
      updateAudio.mutate({
        spaceId: space.id,
        data: { queueEndBehavior: value },
      });
    },
    [space.id, updateAudio],
  );

  // Override playlist handler (Mode 1: Playlist)
  const handlePlaylistChange = useCallback(
    (playlistId: string) => {
      if (!playlistId) {
        message.warning('Please select a playlist');
        return;
      }

      overridePlaylist.mutate({
        spaceId: space.id,
        playlistId,
      });
    },
    [space.id, overridePlaylist],
  );

  // Playlist options for Select
  const playlistOptions = (playlistsData?.items || []).map((playlist) => ({
    label: playlist.name,
    value: playlist.id,
  }));

  return (
    <Card
      title={
        <Flex
          justify='space-between'
          align='center'
        >
          <Title level={5}>{space.name}</Title>
          <Button
            type='text'
            icon={<SettingOutlined />}
            onClick={() => setShowSettings(!showSettings)}
          />
        </Flex>
      }
      loading={isLoadingState}
    >
      <Space
        direction='vertical'
        style={{ width: '100%' }}
        size='middle'
      >
        {/* Playlist Selection (Settings) */}
        {showSettings && (
          <>
            <div>
              <Flex
                justify='space-between'
                align='center'
              >
                <Text
                  strong
                  style={{ display: 'block', marginBottom: 8 }}
                >
                  Select Playlist to Play
                </Text>
                {spaceState?.isManualOverride && (
                  <Tag color='warning'>Manual Override</Tag>
                )}
              </Flex>
              <Select
                size='large'
                placeholder='Choose a playlist'
                options={playlistOptions}
                value={spaceState?.currentQueueItemId || undefined}
                onChange={handlePlaylistChange}
                style={{ width: '100%' }}
                loading={overridePlaylist.isPending}
                disabled={overridePlaylist.isPending}
                showSearch
                optionFilterProp='label'
                allowClear={false}
              />
              {spaceState?.currentTrackName && (
                <Text
                  type='secondary'
                  style={{ fontSize: 12, marginTop: 4 }}
                >
                  Current: {spaceState.currentTrackName}
                  {spaceState.moodName && ` (${spaceState.moodName})`}
                </Text>
              )}

              {/* Audio controls in settings: volume, mute, queue behavior */}
              <div style={{ marginTop: 12 }}>
                <Flex
                  justify='space-between'
                  align='center'
                  style={{ marginBottom: 8 }}
                >
                  <Text strong>Audio</Text>
                  <Space>
                    <Text
                      type='secondary'
                      style={{ fontSize: 12 }}
                    >
                      Volume: {spaceState?.volumePercent ?? 0}%
                    </Text>
                    <Button
                      size='small'
                      type='text'
                      onClick={handleToggleMute}
                    >
                      {spaceState?.isMuted ? 'Unmute' : 'Mute'}
                    </Button>
                  </Space>
                </Flex>

                {/* Queue end behavior moved out of settings to a visible control below the player */}
              </div>
            </div>
            <Divider style={{ margin: '8px 0' }} />
          </>
        )}

        {/* Always show player controls per Rule 1 */}
        <SpacePlayer
          spaceId={space.id}
          hlsUrl={hlsUrl}
          state={spaceState}
          isPlaying={isPlaying}
          isLoading={
            isLoadingState ||
            playbackControl.isPending ||
            overridePlaylist.isPending
          }
          onPlayPause={handlePlayPause}
          onSkipNext={handleSkipNext}
          onSkipPrevious={handleSkipPrevious}
          onSeek={handleSeek}
          onRewind10={handleRewind10}
          onForward10={handleForward10}
          onVolumeChangeComplete={handleVolumeChangeBackend}
          onToggleMute={handleToggleMute}
          onQueueEndBehaviorChange={(next) =>
            handleQueueEndBehaviorChange(next as QueueEndBehavior)
          }
          // Button disable logic (Rule 3)
          isPreviousDisabled={
            queueItems.length === 0 ||
            queueItems.filter((it) => it.position < (currentItem.position ?? 0))
              .length === 0
          }
          isNextDisabled={
            queueItems.length === 0 ||
            (queueItems.filter(
              (it) => it.position > (currentItem.position ?? 0),
            ).length === 0 &&
              (spaceState?.queueEndBehavior ?? QueueEndBehavior.Stop) !==
                QueueEndBehavior.RepeatQueue)
          }
        />

        {/* Repeat button moved into the player component; no duplicate here */}

        {/* AI Explainability Panel */}
        {spaceState && !spaceState.isManualOverride && (
          <>
            <Divider style={{ margin: '8px 0' }} />
            <AIExplainabilityPanel spaceState={spaceState} />
          </>
        )}

        {/* Queue list (render all items sorted) */}
        <Divider style={{ margin: '8px 0' }} />
        <QueueList
          items={queueItems}
          onRemove={() => {}}
          onSkipToTrack={handleSkipToTrack}
        />
      </Space>
    </Card>
  );
};
