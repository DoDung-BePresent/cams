import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Alert,
  Button,
  Space,
  Tag,
  Typography,
  Divider,
  Flex,
  message,
  App,
  Segmented,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import {
  SpacePlayer,
  AIExplainabilityPanel,
  QueueList,
  OverrideSpaceMusicDrawer,
  AddToQueueDrawer,
} from '@/shared/modules/cams/components';
import {
  useSpaceState,
  usePlaybackControl,
  useOverridePlaylist,
  useCancelOverride,
  useUpdateAudioState,
  useUpdateSchedulingState,
  useRemoveQueueItem,
  useRemoveQueueItems,
  useClearQueue,
  useReorderQueue,
} from '@/shared/modules/cams/hooks';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  PlaybackCommand,
  QueueItemSource,
  QueueItemStatus,
  QueueEndBehavior,
  SchedulingSlotOrigin,
} from '@/shared/modules/cams/types';
import type { SpaceQueueItemResponse } from '@/shared/modules/cams/types';
import {
  formatPlaybackTime,
  isSpacePlaying,
} from '@/shared/modules/cams/utils';
import type { SpaceListItem } from '@/shared/modules/spaces/types';
import { AppModal, SettingSwitch } from '@/shared/components';
import { showErrorMessage } from '@/shared/utils';
import { fuzzyProfileService } from '@/features/store/services/fuzzyProfileService';

const { Text } = Typography;

const SCHEDULING_ORIGIN_LABELS: Record<SchedulingSlotOrigin, string> = {
  [SchedulingSlotOrigin.Space]: 'Space Schedule',
  [SchedulingSlotOrigin.Brand]: 'Brand Schedule',
};

interface SpacePlayerCardProps {
  space: SpaceListItem;
  storeId: string;
}

export const SpacePlayerCard = ({ space, storeId }: SpacePlayerCardProps) => {
  const { message: appMessage } = App.useApp();
  const [activeTab, setActiveTab] = useState<'player' | 'settings'>('player');
  const [isOverrideDrawerOpen, setIsOverrideDrawerOpen] = useState(false);
  const [isAddQueueModalOpen, setIsAddQueueModalOpen] = useState(false);
  const [statusNowMs, setStatusNowMs] = useState(() => Date.now());

  // Fetch space state from API (initial load only)
  const { data: spaceState, isLoading: isLoadingState } = useSpaceState(
    space.id,
    true,
  );

  // Mutations
  const playbackControl = usePlaybackControl();
  const overridePlaylist = useOverridePlaylist();
  const cancelOverride = useCancelOverride();
  const updateAudio = useUpdateAudioState();
  const updateSchedulingState = useUpdateSchedulingState();
  const removeQueueItem = useRemoveQueueItem();
  const removeQueueItems = useRemoveQueueItems();
  const clearQueue = useClearQueue();
  const reorderQueue = useReorderQueue();

  useEffect(() => {
    if (
      !spaceState?.manualOverrideExpiresAtUtc &&
      !spaceState?.schedulingEndsAtUtc
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setStatusNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [spaceState?.manualOverrideExpiresAtUtc, spaceState?.schedulingEndsAtUtc]);

  const { data: fuzzyProfile, refetch: refetchFuzzyProfile } = useQuery({
    queryKey: ['space-player-fuzzy-profile', space.id],
    queryFn: async () => {
      const response = await fuzzyProfileService.getBySpace(space.id);
      return response.data.data ?? null;
    },
    enabled: !!space.id,
  });

  const isAutoVolumeEnabled = fuzzyProfile?.autoVolumeEnabled ?? true;

  const toggleAutoVolume = useMutation({
    mutationFn: async (enabled: boolean) => {
      await fuzzyProfileService.patchAutoVolumeBySpace(space.id, enabled);
    },
    onSuccess: async (_, enabled) => {
      appMessage.success(
        enabled ? 'Auto volume enabled.' : 'Auto volume disabled.',
      );
      await refetchFuzzyProfile();
    },
    onError: (error) => {
      showErrorMessage(error, 'Failed to update auto volume setting.');
    },
  });

  // Debounce ref for volume updates
  const volumeUpdateTimeoutRef = useRef<number | null>(null);
  // Previous-button double-tap: first tap seeks to beginning; second tap within this
  // window goes to the actual previous track.
  const prevTapTimestampRef = useRef<number>(0);
  const PREV_DOUBLE_TAP_MS = 2000; // 2 s window

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

  const manualOverrideRemainingSeconds = spaceState?.manualOverrideExpiresAtUtc
    ? Math.max(
        0,
        Math.ceil(
          (new Date(spaceState.manualOverrideExpiresAtUtc).getTime() -
            statusNowMs) /
            1000,
        ),
      )
    : (spaceState?.manualOverrideRemainingSeconds ?? null);

  const schedulingRemainingSeconds = spaceState?.schedulingEndsAtUtc
    ? Math.max(
        0,
        Math.ceil(
          (new Date(spaceState.schedulingEndsAtUtc).getTime() - statusNowMs) /
            1000,
        ),
      )
    : (spaceState?.schedulingRemainingSeconds ?? null);

  // Normalize queue items: accept either `position` or `orderIndex`, accept optional queueStatus from server
  const normalizedQueue = (
    rawQueue as Array<
      Partial<SpaceQueueItemResponse> & {
        orderIndex?: number;
        queueStatus?: number;
        source?: number;
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
      source:
        typeof item.source === 'number'
          ? (item.source as QueueItemSource)
          : QueueItemSource.Manager,
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

    const now = Date.now();
    const timeSinceLastTap = now - prevTapTimestampRef.current;
    prevTapTimestampRef.current = now;

    // First tap (or tap after window expired): seek to start of current track.
    if (timeSinceLastTap > PREV_DOUBLE_TAP_MS) {
      playbackControl.mutate({
        spaceId: space.id,
        command: PlaybackCommand.Seek,
        seekPositionSeconds: 0,
      });
      return;
    }

    // Second tap within the window: jump to previous track.
    const currentPos = currentItem.position ?? 0;
    const previous = queueItems
      .filter((it) => it.position < currentPos)
      .sort((a, b) => b.position - a.position)[0];

    if (previous && previous.queueItemId) {
      playbackControl.mutate({
        spaceId: space.id,
        command: PlaybackCommand.SkipToTrack,
        targetQueueItemId: previous.queueItemId,
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
        targetQueueItemId: _queueItemId,
      });
    },
    [space.id, isPending, playbackControl],
  );

  const handleRemoveQueueItem = useCallback(
    async (queueItemId: string) => {
      if (!queueItemId) {
        return;
      }

      await removeQueueItem.mutateAsync({
        spaceId: space.id,
        queueItemId,
      });
    },
    [removeQueueItem, space.id],
  );

  const handleReorderQueue = useCallback(
    async (orderedQueueItemIds: string[]) => {
      const pendingIdSet = new Set(
        queueItems
          .filter((item) => item.queueStatus === QueueItemStatus.Pending)
          .map((item) => item.queueItemId),
      );

      const pendingOrderedIds = orderedQueueItemIds.filter((id) =>
        pendingIdSet.has(id),
      );

      if (pendingOrderedIds.length === 0) {
        return;
      }

      await reorderQueue.mutateAsync({
        spaceId: space.id,
        data: { queueItemIds: pendingOrderedIds },
      });
    },
    [queueItems, reorderQueue, space.id],
  );

  const handleRemoveQueueItems = useCallback(
    async (queueItemIds: string[]) => {
      if (!queueItemIds.length) {
        return;
      }

      await removeQueueItems.mutateAsync({
        spaceId: space.id,
        queueItemIds,
      });
    },
    [removeQueueItems, space.id],
  );

  const handleClearQueue = useCallback(() => {
    AppModal.confirm({
      title: 'Clear Queue',
      content: 'Are you sure you want to clear the entire queue?',
      okText: 'Clear All',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        await clearQueue.mutateAsync(space.id);
      },
    });
  }, [clearQueue, space.id]);

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
        seekPositionSeconds: Math.max(0, seconds),
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

  const handleOverrideToggle = useCallback(
    (checked: boolean) => {
      if (checked) {
        setIsOverrideDrawerOpen(true);
        return;
      }

      AppModal.confirm({
        title: 'Cancel Manual Override',
        content:
          'Are you sure you want to cancel manual override? AI scheduling will resume automatically.',
        okText: 'Cancel Override',
        cancelText: 'Keep Override',
        onOk: async () => {
          await cancelOverride.mutateAsync(space.id);
        },
      });
    },
    [cancelOverride, space.id],
  );

  return (
    <Space
      direction='vertical'
      style={{ width: '100%' }}
      size='large'
    >
      <Segmented
        block
        size='large'
        value={activeTab}
        onChange={(value) => setActiveTab(value as 'player' | 'settings')}
        options={[
          { label: 'Player', value: 'player' },
          { label: 'Settings', value: 'settings' },
        ]}
      />

      <div style={{ display: activeTab === 'player' ? 'block' : 'none' }}>
        <Space
          direction='vertical'
          style={{ width: '100%' }}
          size='middle'
        >
          {/* Status Alerts */}
          {spaceState?.isManualOverride && (
            <Alert
              type='warning'
              showIcon
              message={
                <Space wrap>
                  <Text strong>Manual Override Active</Text>
                  {spaceState.overrideMode != null && (
                    <Tag color='orange'>Mode {spaceState.overrideMode}</Tag>
                  )}
                  {manualOverrideRemainingSeconds != null && (
                    <Tag color='red'>
                      TTL {formatPlaybackTime(manualOverrideRemainingSeconds)}
                    </Tag>
                  )}
                </Space>
              }
            />
          )}

          {spaceState?.isScheduling && (
            <Alert
              type='info'
              showIcon
              message={
                <Space wrap>
                  <Text strong>Scheduling Runtime Active</Text>
                  {spaceState.schedulingSlotOrigin != null && (
                    <Tag color='blue'>
                      {
                        SCHEDULING_ORIGIN_LABELS[
                          spaceState.schedulingSlotOrigin
                        ]
                      }
                    </Tag>
                  )}
                  {schedulingRemainingSeconds != null && (
                    <Tag color='cyan'>
                      Ends in {formatPlaybackTime(schedulingRemainingSeconds)}
                    </Tag>
                  )}
                </Space>
              }
            />
          )}

          {/* Player Controls */}
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
            isPreviousDisabled={
              queueItems.length === 0 ||
              queueItems.filter(
                (it) => it.position < (currentItem.position ?? 0),
              ).length === 0
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

          {/* AI Explainability Panel */}
          {spaceState && !spaceState.isManualOverride && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <AIExplainabilityPanel spaceState={spaceState} />
            </>
          )}

          {/* Queue Management */}
          <Divider style={{ margin: '8px 0' }} />
          <Flex
            justify='space-between'
            align='center'
          >
            <Text strong>Queue Management</Text>
            <Space>
              <Button
                size='large'
                icon={<DeleteOutlined />}
                danger
                onClick={handleClearQueue}
                loading={clearQueue.isPending}
                disabled={queueItems.length === 0 || clearQueue.isPending}
              >
                Clear Queue
              </Button>
              <Button
                size='large'
                type='primary'
                icon={<PlusOutlined />}
                onClick={() => setIsAddQueueModalOpen(true)}
                disabled={clearQueue.isPending}
              >
                Add to Queue
              </Button>
            </Space>
          </Flex>
          <SimpleBar style={{ maxHeight: '500px' }}>
            <QueueList
              items={queueItems}
              onRemove={handleRemoveQueueItem}
              onRemoveMany={handleRemoveQueueItems}
              onReorder={handleReorderQueue}
              onSkipToTrack={handleSkipToTrack}
            />
          </SimpleBar>
        </Space>
      </div>

      <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
        <Space
          direction='vertical'
          style={{ width: '100%' }}
          size='middle'
        >
          <Space
            direction='vertical'
            style={{ width: '100%' }}
            size={0}
          >
            {/* Settings Switches */}
            <SettingSwitch
              label='Auto Volume'
              description='Adjust volume based on ambient noise level'
              value={isAutoVolumeEnabled}
              onChange={(checked) => toggleAutoVolume.mutate(checked)}
              disabled={toggleAutoVolume.isPending}
            />

            <SettingSwitch
              label='Manual Override'
              description='Manually control music selection instead of AI'
              value={!!spaceState?.isManualOverride}
              onChange={handleOverrideToggle}
              disabled={overridePlaylist.isPending || cancelOverride.isPending}
            />

            <SettingSwitch
              label='Scheduling Mode'
              description='Use schedule-driven playback for active time slots'
              value={!!spaceState?.isScheduling}
              onChange={(checked) => {
                updateSchedulingState.mutate({
                  spaceId: space.id,
                  data: { isScheduling: checked },
                });
              }}
              disabled={updateSchedulingState.isPending}
              loading={updateSchedulingState.isPending}
            />
          </Space>
        </Space>
      </div>

      <AddToQueueDrawer
        open={isAddQueueModalOpen}
        spaceId={space.id}
        storeId={storeId}
        onClose={() => setIsAddQueueModalOpen(false)}
      />

      <OverrideSpaceMusicDrawer
        open={isOverrideDrawerOpen}
        spaceId={space.id}
        storeId={storeId}
        onClose={() => setIsOverrideDrawerOpen(false)}
      />
    </Space>
  );
};