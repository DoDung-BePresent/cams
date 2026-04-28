import { useState, useCallback, useEffect, useRef } from 'react';
import { Space, Typography, Flex, App, Badge, Slider } from 'antd';
import {
  PlusOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  SoundOutlined,
  FastBackwardOutlined,
  FastForwardOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  MutedOutlined,
} from '@ant-design/icons';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import {
  SpacePlayer,
  QueueList,
  OverrideSpaceMusicModal,
  AddToQueueModal,
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
} from '@/shared/modules/cams/types';
import type { SpaceQueueItemResponse } from '@/shared/modules/cams/types';
import { isSpacePlaying } from '@/shared/modules/cams/utils';
import type { SpaceListItem } from '@/shared/modules/spaces/types';
import { AppModal, SettingSwitch } from '@/shared/components';
import { showErrorMessage } from '@/shared/utils';
import { fuzzyProfileService } from '@/features/store/services/fuzzyProfileService';

const { Text } = Typography;

interface SpacePlayerCardProps {
  space: SpaceListItem;
  storeId: string;
  layout?: 'card' | 'full';
}

type PanelView = 'player' | 'queue' | 'settings' | 'ai';

export const SpacePlayerCard = ({
  space,
  storeId,
  layout = 'card',
}: SpacePlayerCardProps) => {
  const { message: appMessage } = App.useApp();
  const [panel, setPanel] = useState<PanelView>('player');
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isAddQueueModalOpen, setIsAddQueueModalOpen] = useState(false);
  const [statusNowMs, setStatusNowMs] = useState(() => Date.now());
  const [isHoveringVolume, setIsHoveringVolume] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [scoreHistory, setScoreHistory] = useState<{
    chill: number[];
    focus: number[];
    energetic: number[];
  }>({
    chill: [],
    focus: [],
    energetic: [],
  });

  // Theme tokens
  const T = {
    bg: isDark ? '#0a0a12' : '#f8fafc',
    surface: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    surfaceActive: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    text: isDark ? '#e5e7eb' : '#1e293b',
    textMuted: isDark ? '#9ca3af' : '#64748b',
    textSubtle: isDark ? '#6b7280' : '#94a3b8',
    panelBg: isDark ? 'rgba(0,0,0,0.3)' : '#ffffff',
    pillBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const isFull = layout === 'full';

  const { data: spaceState, isLoading: isLoadingState } = useSpaceState(
    space.id,
    true,
  );

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
    )
      return;
    const id = window.setInterval(() => setStatusNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [spaceState?.manualOverrideExpiresAtUtc, spaceState?.schedulingEndsAtUtc]);

  const { data: fuzzyProfile, refetch: refetchFuzzyProfile } = useQuery({
    queryKey: ['space-player-fuzzy-profile', space.id],
    queryFn: async () => {
      const res = await fuzzyProfileService.getBySpace(space.id);
      return res.data.data ?? null;
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
    onError: (err) =>
      showErrorMessage(err, 'Failed to update auto volume setting.'),
  });

  const volumeUpdateTimeoutRef = useRef<number | null>(null);
  const prevTapTimestampRef = useRef<number>(0);
  const PREV_DOUBLE_TAP_MS = 2000;

  const hlsUrl = spaceState?.hlsUrl || null;
  const hasActiveTrack = !!spaceState?.currentQueueItemId;
  const isPending = !!spaceState?.pendingQueueItemId;
  const rawQueue = spaceState?.spaceQueueItems || [];

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

  const sortedByPosition = [...normalizedQueue].sort(
    (a, b) => (a.position! as number) - (b.position! as number),
  );
  const currentItem = sortedByPosition.find(
    (i) => i.queueItemId === spaceState?.currentQueueItemId,
  ) || { position: 0 };

  const queueItems: SpaceQueueItemResponse[] = sortedByPosition.map((i) => {
    const position = i.position ?? 0;
    let queueStatus: QueueItemStatus;
    if (typeof i.rawStatus === 'number')
      queueStatus = i.rawStatus as QueueItemStatus;
    else if (i.queueItemId === spaceState?.currentQueueItemId)
      queueStatus = QueueItemStatus.Playing;
    else if (i.queueItemId === spaceState?.pendingQueueItemId)
      queueStatus = QueueItemStatus.Pending;
    else if (position < (currentItem.position ?? 0))
      queueStatus = QueueItemStatus.Played;
    else queueStatus = QueueItemStatus.Pending;
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

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    if (!hasActiveTrack) {
      appMessage.warning('Please select a playlist first');
      return;
    }
    if (isPending) {
      appMessage.info('Playlist is being prepared. Please wait...');
      return;
    }
    playbackControl.mutate({
      spaceId: space.id,
      command: isPlaying ? PlaybackCommand.Pause : PlaybackCommand.Resume,
    });
  }, [
    space.id,
    isPlaying,
    hasActiveTrack,
    isPending,
    playbackControl,
    appMessage,
  ]);

  const handleSkipNext = useCallback(() => {
    if (isPending) {
      appMessage.info('Playlist is being prepared. Please wait...');
      return;
    }
    playbackControl.mutate({
      spaceId: space.id,
      command: PlaybackCommand.SkipNext,
    });
  }, [space.id, isPending, playbackControl, appMessage]);

  const handleSkipPrevious = useCallback(() => {
    if (isPending) {
      appMessage.info('Playlist is being prepared. Please wait...');
      return;
    }
    const now = Date.now();
    const timeSinceLastTap = now - prevTapTimestampRef.current;
    prevTapTimestampRef.current = now;
    if (timeSinceLastTap > PREV_DOUBLE_TAP_MS) {
      playbackControl.mutate({
        spaceId: space.id,
        command: PlaybackCommand.Seek,
        seekPositionSeconds: 0,
      });
      return;
    }
    const currentPos = currentItem.position ?? 0;
    const previous = queueItems
      .filter((it) => it.position < currentPos)
      .sort((a, b) => b.position - a.position)[0];
    if (previous?.queueItemId) {
      playbackControl.mutate({
        spaceId: space.id,
        command: PlaybackCommand.SkipToTrack,
        targetQueueItemId: previous.queueItemId,
      });
      return;
    }
    playbackControl.mutate({
      spaceId: space.id,
      command: PlaybackCommand.SkipPrevious,
    });
  }, [
    space.id,
    isPending,
    playbackControl,
    currentItem.position,
    queueItems,
    appMessage,
  ]);

  const handleSkipToTrack = useCallback(
    (_queueItemId: string, trackId?: string) => {
      if (isPending) {
        appMessage.info('Playlist is being prepared. Please wait...');
        return;
      }
      if (!trackId) {
        appMessage.warning('Track not available');
        return;
      }
      playbackControl.mutate({
        spaceId: space.id,
        command: PlaybackCommand.SkipToTrack,
        targetQueueItemId: _queueItemId,
      });
    },
    [space.id, isPending, playbackControl, appMessage],
  );

  const handleRemoveQueueItem = useCallback(
    async (queueItemId: string) => {
      if (!queueItemId) return;
      await removeQueueItem.mutateAsync({ spaceId: space.id, queueItemId });
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
      if (pendingOrderedIds.length === 0) return;
      await reorderQueue.mutateAsync({
        spaceId: space.id,
        data: { queueItemIds: pendingOrderedIds },
      });
    },
    [queueItems, reorderQueue, space.id],
  );

  const handleRemoveQueueItems = useCallback(
    async (queueItemIds: string[]) => {
      if (!queueItemIds.length) return;
      await removeQueueItems.mutateAsync({ spaceId: space.id, queueItemIds });
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

  const handleSeek = useCallback(
    (seconds: number) => {
      if (isPending) {
        appMessage.info('Playlist is being prepared. Please wait...');
        return;
      }
      playbackControl.mutate({
        spaceId: space.id,
        command: PlaybackCommand.Seek,
        seekPositionSeconds: Math.max(0, seconds),
      });
    },
    [space.id, isPending, playbackControl, appMessage],
  );

  const handleRewind10 = useCallback(() => {
    if (isPending) return;
    playbackControl.mutate({
      spaceId: space.id,
      command: PlaybackCommand.SeekBackward,
      seekPositionSeconds: 10,
    });
  }, [space.id, isPending, playbackControl]);

  const handleForward10 = useCallback(() => {
    if (isPending) return;
    playbackControl.mutate({
      spaceId: space.id,
      command: PlaybackCommand.SeekForward,
      seekPositionSeconds: 10,
    });
  }, [space.id, isPending, playbackControl]);

  const handleVolumeChange = useCallback(
    (value: number) => {
      updateAudio.mutate({ spaceId: space.id, data: { volumePercent: value } });
    },
    [space.id, updateAudio],
  );

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
        setIsOverrideModalOpen(true);
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

  // ─── AI score breakdown from spaceState ──────────────────────────────────
  const rawScoreBreakdown = (spaceState as unknown as Record<string, unknown>)
    ?.fuzzyScoreBreakdown as
    | {
        chillScore?: number;
        focusScore?: number;
        energeticScore?: number;
        chill_score?: number;
        focus_score?: number;
        energetic_score?: number;
        signalContributions?: unknown[];
        signal_contributions?: unknown[];
        contributions?: unknown[];
      }
    | null
    | undefined;

  const realContributions =
    rawScoreBreakdown?.signalContributions ??
    rawScoreBreakdown?.signal_contributions ??
    rawScoreBreakdown?.contributions ??
    [];

  const toP = (v?: number | null) =>
    typeof v === 'number'
      ? Math.round(Math.max(0, Math.min(1, v)) * 100)
      : null;
  const chillPct =
    toP(rawScoreBreakdown?.chillScore ?? rawScoreBreakdown?.chill_score) ?? 0;
  const focusPct =
    toP(rawScoreBreakdown?.focusScore ?? rawScoreBreakdown?.focus_score) ?? 0;
  const energPct =
    toP(
      rawScoreBreakdown?.energeticScore ?? rawScoreBreakdown?.energetic_score,
    ) ?? 0;
  const confPct =
    toP((spaceState as { fuzzyConfidence?: number })?.fuzzyConfidence) ?? 0;

  const bpmMin = spaceState?.bpmMin ?? null;
  const bpmMax = spaceState?.bpmMax ?? null;
  const bpmTarget = spaceState?.bpmTarget ?? null;

  // Track history for real data sparklines
  useEffect(() => {
    if (isLoadingState || !spaceState) return;

    // Check if we actually need to update history to avoid unnecessary renders
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScoreHistory((prev) => {
      const lastChill = prev.chill[prev.chill.length - 1];
      if (lastChill === chillPct && prev.chill.length > 0) return prev;

      return {
        chill: [...prev.chill.slice(-23), chillPct],
        focus: [...prev.focus.slice(-23), focusPct],
        energetic: [...prev.energetic.slice(-23), energPct],
      };
    });
  }, [chillPct, focusPct, energPct, isLoadingState, spaceState]);

  const getMoodTheme = (moodName?: string | null) => {
    const mood = moodName?.toLowerCase() || '';
    if (mood.includes('chill'))
      return {
        color: '#10b981',
        glow: 'rgba(16,185,129,0.4)',
        bg: 'rgba(16,185,129,0.15)',
        shadow: 'rgba(16,185,129,0.15)',
      };
    if (mood.includes('focus'))
      return {
        color: '#3b82f6',
        glow: 'rgba(59,130,246,0.4)',
        bg: 'rgba(59,130,246,0.15)',
        shadow: 'rgba(59,130,246,0.15)',
      };
    if (mood.includes('energetic') || mood.includes('uplifting'))
      return {
        color: '#f59e0b',
        glow: 'rgba(245,158,11,0.4)',
        bg: 'rgba(245,158,11,0.15)',
        shadow: 'rgba(245,158,11,0.15)',
      };
    return {
      color: '#818cf8',
      glow: 'rgba(129,140,248,0.4)',
      bg: 'rgba(129,140,248,0.15)',
      shadow: 'rgba(129,140,248,0.15)',
    };
  };

  const theme = getMoodTheme(spaceState?.moodName);

  const VISUALIZER_CSS = `
    @keyframes barPulseEnergetic {
      0%, 100% { height: 15px; opacity: 0.4; }
      50% { height: 120px; opacity: 1; }
    }
    @keyframes barPulseChill {
      0%, 100% { height: 20px; opacity: 0.3; }
      50% { height: 60px; opacity: 0.7; }
    }
    .viz-bar {
      width: 12px;
      background: linear-gradient(to top, ${theme.color}, ${isDark ? '#fff' : 'rgba(0,0,0,0.5)'});
      mask-image: repeating-linear-gradient(to bottom, black 0, black 6px, transparent 6px, transparent 8px);
      transition: all 0.2s ease;
    }
    .viz-bar-energetic { animation: barPulseEnergetic 0.6s ease-in-out infinite; }
    .viz-bar-chill { animation: barPulseChill 1.5s ease-in-out infinite; }
  `;

  // ─── Sub-renderers (internal to simplify main JSX) ─────────────────────────
  const renderMoodVisualizer = () => {
    const isEnergetic = spaceState?.moodName
      ?.toLowerCase()
      .includes('energetic');
    const isPlayingActual = isPlaying && !isLoadingState;
    const barCount = 12;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 4,
          height: 120,
          width: '100%',
        }}
      >
        <style>{VISUALIZER_CSS}</style>
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            className={`viz-bar ${isPlayingActual ? (isEnergetic ? 'viz-bar-energetic' : 'viz-bar-chill') : ''}`}
            style={{
              height: isPlayingActual ? undefined : 8,
              opacity: isPlayingActual ? undefined : 0.2,
              animationDelay: `${i * 0.08}s`,
              filter: isPlayingActual
                ? `drop-shadow(0 0 8px ${theme.color}44)`
                : 'none',
            }}
          />
        ))}
      </div>
    );
  };

  const renderQueue = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Flex
        justify='space-between'
        align='center'
        style={{ padding: '0 8px 20px' }}
      >
        <div>
          <div
            style={{
              color: T.textMuted,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 2,
              fontWeight: 700,
            }}
          >
            Up Next
          </div>
          <div style={{ color: T.textSubtle, fontSize: 12, marginTop: 2 }}>
            {queueItems.length} tracks in queue
          </div>
        </div>
        <Space size={12}>
          <button
            onClick={handleClearQueue}
            disabled={queueItems.length === 0 || clearQueue.isPending}
            style={{
              background: 'transparent',
              border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.5)'}`,
              color: '#ef4444',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              cursor: 'pointer',
              opacity: queueItems.length === 0 ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            Clear
          </button>
          <button
            onClick={() => setIsAddQueueModalOpen(true)}
            style={{
              background: theme.color,
              border: 'none',
              color: '#fff',
              padding: '6px 16px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: `0 4px 12px ${theme.color}44`,
              transition: 'all 0.2s',
            }}
          >
            + Add Track
          </button>
        </Space>
      </Flex>
      <SimpleBar
        style={{ flex: 1, maxHeight: isFull ? 'calc(100vh - 320px)' : 360 }}
      >
        <QueueList
          items={queueItems}
          onRemove={handleRemoveQueueItem}
          onRemoveMany={handleRemoveQueueItems}
          onReorder={handleReorderQueue}
          onSkipToTrack={handleSkipToTrack}
        />
      </SimpleBar>
    </div>
  );

  const makeSparkline = (
    history: number[],
    currentPct: number,
    color: string,
    moodType: string,
    w = 120,
    h = 36,
  ) => {
    const baselines: Record<string, number[]> = {
      chill: [60, 70, 50, 30, 20, 15, 20, 30, 40, 30, 40, 60, 70, 80, 85, 90],
      focus: [20, 30, 60, 80, 70, 50, 40, 60, 80, 70, 40, 30, 20, 15, 10, 5],
      energetic: [
        5, 10, 20, 40, 70, 90, 85, 70, 60, 85, 95, 80, 60, 40, 20, 10,
      ],
    };
    const baseline = baselines[moodType.toLowerCase()] || baselines.chill;
    const displayPoints =
      history.length > 5 ? history : [...baseline.slice(0, 8), currentPct];
    const xStep = w / (displayPoints.length - 1);
    const coords = displayPoints.map((p, i) => [
      i * xStep,
      h - ((p - 0) / 100) * (h - 4) - 2,
    ]);
    const path = coords
      .map(
        (c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(1)},${c[1].toFixed(1)}`,
      )
      .join(' ');
    const area = `${path} L${w},${h} L0,${h} Z`;
    const gid = `sg${color.replace('#', '')}`;
    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient
            id={gid}
            x1='0'
            y1='0'
            x2='0'
            y2='1'
          >
            <stop
              offset='0%'
              stopColor={color}
              stopOpacity='0.3'
            />
            <stop
              offset='100%'
              stopColor={color}
              stopOpacity='0'
            />
          </linearGradient>
        </defs>
        <path
          d={coords
            .map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(1)},${h - 2}`)
            .join(' ')}
          fill='none'
          stroke='rgba(255,255,255,0.05)'
          strokeWidth='1'
          strokeDasharray='2,2'
        />
        <path
          d={area}
          fill={`url(#${gid})`}
        />
        <path
          d={path}
          fill='none'
          stroke={color}
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <circle
          cx={coords[coords.length - 1][0]}
          cy={coords[coords.length - 1][1]}
          r='3'
          fill={color}
        >
          <animate
            attributeName='r'
            values='3;5;3'
            dur='2s'
            repeatCount='indefinite'
          />
          <animate
            attributeName='opacity'
            values='1;0.5;1'
            dur='2s'
            repeatCount='indefinite'
          />
        </circle>
      </svg>
    );
  };

  const ConfidenceGauge = ({ pct }: { pct: number }) => {
    const r = 44,
      cx = 56,
      cy = 56,
      sw = 8;
    const circumference = Math.PI * r;
    const offset = circumference * (1 - pct / 100);
    const col = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
    const lbl = pct >= 70 ? 'High' : pct >= 40 ? 'Medium' : 'Low';
    return (
      <svg
        width={112}
        height={66}
        viewBox='0 0 112 66'
      >
        <path
          d={`M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}`}
          fill='none'
          stroke={isDark ? '#1f2937' : '#e2e8f0'}
          strokeWidth={sw}
          strokeLinecap='round'
        />
        <path
          d={`M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}`}
          fill='none'
          stroke={col}
          strokeWidth={sw}
          strokeLinecap='round'
          strokeDasharray={`${circumference}`}
          strokeDashoffset={`${offset}`}
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)',
            filter: `drop-shadow(0 0 6px ${col}88)`,
          }}
        />
        <text
          x={cx}
          y={cy - 8}
          textAnchor='middle'
          fill={T.text}
          fontSize='20'
          fontWeight='800'
        >
          {pct}%
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor='middle'
          fill={col}
          fontSize='10'
          fontWeight='700'
          style={{ textTransform: 'uppercase', letterSpacing: 1 }}
        >
          {lbl}
        </text>
      </svg>
    );
  };

  const renderAIScores = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ flex: 1, paddingRight: 16 }}>
          <div
            style={{
              color: T.textMuted,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              marginBottom: 6,
            }}
          >
            AI Confidence
          </div>
          <div style={{ color: T.textSubtle, fontSize: 13, lineHeight: 1.5 }}>
            {confPct >= 70
              ? 'High confidence in current mood selection'
              : confPct >= 40
                ? 'Moderate — monitoring contextual signals'
                : 'Low confidence, AI is recalibrating'}
          </div>
          {spaceState?.fuzzyRule && (
            <div
              style={{
                marginTop: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: isDark ? 'rgba(99,102,241,0.15)' : '#e0e7ff',
                border: `1px solid ${isDark ? 'rgba(99,102,241,0.3)' : '#c7d2fe'}`,
                borderRadius: 6,
                padding: '3px 8px',
              }}
            >
              <span
                style={{
                  color: '#818cf8',
                  fontSize: 11,
                  fontFamily: 'monospace',
                }}
              >
                {spaceState.fuzzyRule
                  .replace(/^RULE_\d+_/, '')
                  .replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </div>
        <ConfidenceGauge pct={confPct} />
      </div>
      <div>
        <div
          style={{
            color: T.textMuted,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginBottom: 12,
          }}
        >
          Mood Distribution
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {renderMoodCard(
            'Chill',
            chillPct,
            '#10b981',
            '🌿',
            spaceState?.moodName?.toLowerCase().includes('chill'),
            T,
            isDark,
            scoreHistory,
            makeSparkline,
          )}
          {renderMoodCard(
            'Focus',
            focusPct,
            '#3b82f6',
            '🎯',
            spaceState?.moodName?.toLowerCase().includes('focus'),
            T,
            isDark,
            scoreHistory,
            makeSparkline,
          )}
          {renderMoodCard(
            'Energetic',
            energPct,
            '#f59e0b',
            '⚡',
            spaceState?.moodName?.toLowerCase().includes('energetic'),
            T,
            isDark,
            scoreHistory,
            makeSparkline,
          )}
        </div>
      </div>
      <div>
        <div
          style={{
            color: T.textMuted,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginBottom: 12,
          }}
        >
          Core Signal Impact
        </div>
        <div
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            padding: '16px',
          }}
        >
          {realContributions.length === 0 ? (
            <div
              style={{
                color: T.textMuted,
                fontSize: 12,
                textAlign: 'center',
                padding: '20px 0',
              }}
            >
              No live signal data available
            </div>
          ) : (
            realContributions
              .slice(0, 5)
              .map(
                (
                  sig: {
                    name?: string;
                    signal?: string;
                    [key: string]: unknown;
                  },
                  i: number,
                ) => (
                  <div
                    key={sig.name + i}
                    style={{
                      marginBottom: i === 4 ? 0 : 16,
                      paddingBottom: i === 4 ? 0 : 16,
                      borderBottom: i === 4 ? 'none' : `1px solid ${T.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{'📡'}</span>
                        <span
                          style={{
                            color: T.text,
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {sig.signal}
                        </span>
                      </div>
                    </div>
                  </div>
                ),
              )
          )}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div>
      <Text
        style={{
          color: T.textMuted,
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          display: 'block',
          marginBottom: 20,
        }}
      >
        Settings
      </Text>
      <Space
        direction='vertical'
        style={{ width: '100%' }}
        size={0}
      >
        <SettingSwitch
          label='Auto Volume'
          description='Adjust volume based on ambient noise level'
          value={isAutoVolumeEnabled}
          onChange={(c) => toggleAutoVolume.mutate(c)}
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
          onChange={(c) =>
            updateSchedulingState.mutate({
              spaceId: space.id,
              data: { isScheduling: c },
            })
          }
          disabled={updateSchedulingState.isPending}
          loading={updateSchedulingState.isPending}
        />
      </Space>
    </div>
  );

  const playerProps = {
    spaceId: space.id,
    hlsUrl,
    state: spaceState,
    isPlaying,
    isLoading: isLoadingState || playbackControl.isPending,
    onPlayPause: handlePlayPause,
    onSkipNext: handleSkipNext,
    onSkipPrevious: handleSkipPrevious,
    onSeek: handleSeek,
    onRewind10: handleRewind10,
    onForward10: handleForward10,
    onVolumeChangeComplete: handleVolumeChangeBackend,
    onToggleMute: handleToggleMute,
    onQueueEndBehaviorChange: (next: string | number) =>
      handleQueueEndBehaviorChange(next as QueueEndBehavior),
    onTimeUpdate: setCurrentTime,
    onDurationChange: setDuration,
  };

  if (isFull) {
    return (
      <div
        style={{
          background: T.bg,
          minHeight: 'calc(100vh - 112px)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Inter', sans-serif",
          color: T.text,
          transition: 'all 0.3s ease',
        }}
      >
        {renderStatusBanner(
          spaceState,
          manualOverrideRemainingSeconds,
          schedulingRemainingSeconds,
        )}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div
            style={{
              flex: '0 0 420px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 32px',
              borderRight: `1px solid ${T.border}`,
              background: isDark
                ? 'linear-gradient(180deg, rgba(124,58,237,0.08) 0%, transparent 60%)'
                : 'transparent',
            }}
          >
            <div style={{ width: '100%', marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <SoundOutlined style={{ color: '#818cf8', fontSize: 18 }} />
                <Text style={{ color: T.text, fontSize: 18, fontWeight: 700 }}>
                  {space.name}
                </Text>
              </div>
            </div>
            <div
              style={{
                position: 'relative',
                width: 280,
                height: 280,
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: isDark
                    ? `radial-gradient(circle at 40% 35%, ${theme.color}44 0%, ${theme.color}22 40%, rgba(15,23,42,0.9) 100%)`
                    : `radial-gradient(circle at 40% 35%, ${theme.color}22 0%, #fff 100%)`,
                  border: `1px solid ${theme.color}44`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isPlaying && !isLoadingState ? (
                  renderMoodVisualizer(
                    isPlaying && !isLoadingState,
                    !!spaceState?.moodName?.toLowerCase().includes('energetic'),
                    theme.color,
                    isDark,
                    VISUALIZER_CSS,
                  )
                ) : bpmTarget !== null ? (
                  <>
                    <div
                      style={{
                        color: isDark ? '#a5b4fc' : '#4f46e5',
                        fontSize: 13,
                        marginBottom: 4,
                      }}
                    >
                      Target: {bpmTarget}
                    </div>
                    <div
                      style={{
                        color: T.text,
                        fontSize: 40,
                        fontWeight: 800,
                        lineHeight: 1,
                        letterSpacing: -1,
                      }}
                    >
                      {bpmMin}–{bpmMax}
                    </div>
                    <div
                      style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}
                    >
                      BPM range
                    </div>
                  </>
                ) : (
                  <SoundOutlined style={{ fontSize: 56, color: theme.color }} />
                )}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 24px',
                borderRadius: 50,
                background: T.pillBg,
                border: `1px solid ${T.border}`,
              }}
            >
              <ControlBtn
                onClick={handleSkipPrevious}
                disabled={isPending}
                themeColor={theme.color}
                textColor={T.text}
              >
                <StepBackwardOutlined />
              </ControlBtn>
              <ControlBtn
                onClick={handleRewind10}
                disabled={isPending}
                themeColor={theme.color}
                textColor={T.text}
              >
                <FastBackwardOutlined style={{ fontSize: 14 }} />
              </ControlBtn>
              <ControlBtn
                onClick={handlePlayPause}
                primary
                disabled={isPending}
                themeColor={theme.color}
                textColor={T.text}
              >
                {isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              </ControlBtn>
              <ControlBtn
                onClick={handleForward10}
                disabled={isPending}
                themeColor={theme.color}
                textColor={T.text}
              >
                <FastForwardOutlined style={{ fontSize: 14 }} />
              </ControlBtn>
              <ControlBtn
                onClick={handleSkipNext}
                disabled={isPending}
                themeColor={theme.color}
                textColor={T.text}
              >
                <StepForwardOutlined />
              </ControlBtn>
              <div
                style={{
                  width: 1,
                  height: 20,
                  background: T.border,
                  margin: '0 4px',
                }}
              />
              <div
                onMouseEnter={() => setIsHoveringVolume(true)}
                onMouseLeave={() => setIsHoveringVolume(false)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {isHoveringVolume && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 40,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      height: 120,
                      width: 32,
                      background: isDark ? 'rgba(20,20,30,0.95)' : '#fff',
                      borderRadius: 16,
                      padding: '12px 0',
                      border: `1px solid ${T.border}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      zIndex: 10,
                    }}
                  >
                    <Slider
                      vertical
                      value={spaceState?.volumePercent ?? 75}
                      onChange={handleVolumeChange}
                      styles={{
                        track: { background: '#818cf8' },
                        handle: { background: '#fff', border: 'none' },
                      }}
                    />
                  </div>
                )}
                <ControlBtn
                  onClick={handleToggleMute}
                  themeColor={theme.color}
                  textColor={T.text}
                >
                  {spaceState?.isMuted ? (
                    <MutedOutlined style={{ color: '#ef4444' }} />
                  ) : (
                    <SoundOutlined />
                  )}
                </ControlBtn>
              </div>
            </div>

            {/* Hidden SpacePlayer for HLS + seek/progress */}
            <div style={{ display: 'none' }}>
              <SpacePlayer {...playerProps} />
            </div>
          </div>

          {/* ── RIGHT: Tabbed panel ── */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: T.panelBg,
            }}
          >
            {/* Tab bar */}
            <div
              style={{
                display: 'flex',
                borderBottom: `1px solid ${T.border}`,
                padding: '0 8px',
              }}
            >
              {rightTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setPanel(tab.key)}
                  style={{
                    padding: '18px 24px',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    color: panel === tab.key ? theme.color : T.textMuted,
                    fontSize: 14,
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    borderBottom:
                      panel === tab.key
                        ? `2px solid ${theme.color}`
                        : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {tab.label}
                  {tab.badge ? (
                    <span
                      style={{
                        background: theme.color,
                        color: '#fff',
                        fontSize: 11,
                        padding: '1px 7px',
                        borderRadius: 10,
                        fontWeight: 700,
                      }}
                    >
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
              {panel === 'queue' && renderQueue()}
              {panel === 'ai' && renderAIScores()}
              {panel === 'settings' && renderSettings()}
              {panel === 'player' && renderQueue()}
            </div>
          </div>
        </div>

        <AddToQueueModal
          open={isAddQueueModalOpen}
          spaceId={space.id}
          storeId={storeId}
          onClose={() => setIsAddQueueModalOpen(false)}
        />
        <OverrideSpaceMusicModal
          open={isOverrideModalOpen}
          spaceId={space.id}
          storeId={storeId}
          onClose={() => setIsOverrideModalOpen(false)}
        />

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
          }
        `}</style>
      </div>
    );
  }

  // ─── CARD LAYOUT (for modal/embedded use) ────────────────────────────────
  const cardTabs: Array<{
    key: PanelView;
    icon: React.ReactNode;
    label: string;
    badge?: number;
  }> = [
    { key: 'player', icon: <SoundOutlined />, label: 'Player' },
    {
      key: 'queue',
      icon: <PlusOutlined />,
      label: 'Queue',
      badge: queueItems.length || undefined,
    },
    { key: 'ai', icon: <ThunderboltOutlined />, label: 'AI' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
  ];

  return (
    <div
      style={{
        background: T.bg,
        borderRadius: 16,
        overflow: 'hidden',
        minHeight: 480,
        display: 'flex',
        flexDirection: 'column',
        color: T.text,
        transition: 'all 0.3s ease',
        border: `1px solid ${T.border}`,
      }}
    >
      {renderStatusBanner()}
      <div
        style={{
          padding: '24px 20px 16px',
          background: `linear-gradient(180deg, ${theme.color}22 0%, transparent 100%)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: isDark
                ? `radial-gradient(circle at 40% 35%, ${theme.color}66 0%, rgba(15,23,42,0.9) 100%)`
                : `radial-gradient(circle at 40% 35%, ${theme.color}44 0%, #fff 100%)`,
              border: `1px solid ${theme.color}44`,
              boxShadow: isPlaying
                ? `0 0 40px ${theme.color}66`
                : '0 0 20px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.5s ease',
              position: 'relative',
            }}
          >
            {spaceState?.coverImageUrl ? (
              <img
                src={spaceState.coverImageUrl}
                alt='cover'
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <SoundOutlined
                style={{
                  fontSize: 52,
                  color: isPlaying ? theme.color : T.textSubtle,
                }}
              />
            )}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              color: T.text,
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            {spaceState?.currentTrackName || 'No track playing'}
          </div>
          {spaceState?.moodName && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 10px',
                borderRadius: 20,
                background: `${theme.color}22`,
                border: `1px solid ${theme.color}66`,
                color: theme.color,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <EyeOutlined /> {spaceState.moodName}
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, padding: '0 16px 16px' }}>
        {panel === 'player' && <SpacePlayer {...playerProps} />}
        {panel === 'queue' && renderQueue()}
        {panel === 'ai' && renderAIScores()}
        {panel === 'settings' && renderSettings()}
      </div>

      <div
        style={{
          display: 'flex',
          borderTop: `1px solid ${T.border}`,
          padding: '4px 0',
          alignItems: 'stretch',
        }}
      >
        {cardTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPanel(tab.key)}
            style={{
              flex: 1,
              padding: '10px 4px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: panel === tab.key ? theme.color : T.textMuted,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              fontSize: 18,
              transition: 'color 0.2s',
              borderTop:
                panel === tab.key
                  ? `2px solid ${theme.color}`
                  : '2px solid transparent',
            }}
          >
            <Badge
              count={tab.badge}
              size='small'
              offset={[4, 0]}
            >
              {tab.icon}
            </Badge>
            <span
              style={{
                fontSize: 10,
                color: panel === tab.key ? theme.color : T.textSubtle,
              }}
            >
              {tab.label}
            </span>
          </button>
        ))}
        <button
          onClick={() => setIsDark((d) => !d)}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            padding: '10px 12px',
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            color: T.textMuted,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            fontSize: 16,
            transition: 'color 0.2s',
            borderTop: '2px solid transparent',
          }}
        >
          {isDark ? '☀️' : '🌙'}
          <span style={{ fontSize: 9, color: T.textSubtle }}>
            {isDark ? 'Light' : 'Dark'}
          </span>
        </button>
      </div>

      <AddToQueueModal
        open={isAddQueueModalOpen}
        spaceId={space.id}
        storeId={storeId}
        onClose={() => setIsAddQueueModalOpen(false)}
      />
      <OverrideSpaceMusicModal
        open={isOverrideModalOpen}
        spaceId={space.id}
        storeId={storeId}
        onClose={() => setIsOverrideModalOpen(false)}
      />
    </div>
  );
};
