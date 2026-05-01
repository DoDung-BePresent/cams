import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Space, Tag, Typography, Flex, App, Badge, Slider } from 'antd';
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
  AIExplainabilityPanel,
  QueueList,
  OverrideSpaceMusicModal,
  AddToQueueModal,
  RepeatButton,
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
import {
  formatPlaybackTime,
  getCamsMoodTheme,
  isCamsQueueItemStatus,
  isSpacePlaying,
} from '@/shared/modules/cams/utils';
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isHoveringVolume, setIsHoveringVolume] = useState(false);

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
    if (isCamsQueueItemStatus(i.rawStatus)) queueStatus = i.rawStatus;
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
  const currentCoverImageUrl =
    queueItems.find(
      (item) => item.queueItemId === spaceState?.currentQueueItemId,
    )?.coverImageUrl ?? null;

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
  type SignalContribution = {
    signal?: string;
    chillDelta?: number;
    focusDelta?: number;
    energeticDelta?: number;
  };

  const rawScoreBreakdown = (spaceState as unknown as Record<string, unknown>)
    ?.fuzzyScoreBreakdown as
    | {
        chillScore?: number;
        focusScore?: number;
        energeticScore?: number;
        chill_score?: number;
        focus_score?: number;
        energetic_score?: number;
        signalContributions?: SignalContribution[];
        signal_contributions?: SignalContribution[];
        contributions?: SignalContribution[];
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

  const scoreHistory = useMemo(
    () => ({
      chill: [chillPct],
      focus: [focusPct],
      energetic: [energPct],
    }),
    [chillPct, focusPct, energPct],
  );

  const theme = getCamsMoodTheme(spaceState?.moodName);
  const playerTheme = theme;

  const VISUALIZER_CSS = `
    @keyframes waveFloat {
      0%, 100% { transform: translateX(-10px); }
      50% { transform: translateX(10px); }
    }
    @keyframes waveGlow {
      0%, 100% { opacity: 0.58; }
      50% { opacity: 1; }
    }
    .audio-wave-layer {
      animation: waveFloat var(--wave-speed) ease-in-out infinite;
    }
    .audio-wave-primary {
      animation: waveGlow var(--wave-speed) ease-in-out infinite;
    }
  `;

  // ─── Sub-components ───────────────────────────────────────────────────────
  const renderMoodVisualizer = () => {
    const mood = spaceState?.moodName?.toLowerCase() ?? '';
    const isEnergetic = mood.includes('energetic') || mood.includes('social');
    const isFocus = mood.includes('focus');
    const isCalm = mood.includes('calm') || mood.includes('chill');
    const safeBpm =
      typeof bpmTarget === 'number' && bpmTarget > 0
        ? Math.max(45, Math.min(180, bpmTarget))
        : null;
    const fallbackBeatSeconds = isEnergetic ? 0.52 : isFocus ? 0.78 : 1.08;
    const beatSeconds = safeBpm
      ? Math.max(0.34, Math.min(1.35, 60 / safeBpm))
      : fallbackBeatSeconds;
    const speed = `${beatSeconds.toFixed(2)}s`;
    const bpmEnergy = safeBpm
      ? (safeBpm - 45) / 135
      : isEnergetic
        ? 0.85
        : 0.45;
    const bpmAmplitudeBoost = 1 + bpmEnergy * 0.55;
    const tone = isEnergetic
      ? { primary: '#fb7185', secondary: '#f59e0b', glow: '#fb718555' }
      : isCalm
        ? { primary: '#22d3ee', secondary: '#60a5fa', glow: '#22d3ee44' }
        : { primary: '#3b82f6', secondary: '#818cf8', glow: '#3b82f655' };

    const makeWavePath = (
      amplitude: number,
      frequency: number,
      phase: number,
    ) => {
      const points = Array.from({ length: 57 }, (_, i) => {
        const x = i * 10;
        const y =
          90 +
          Math.sin(i * frequency + phase) * amplitude +
          Math.sin(i * frequency * 0.42 + phase * 1.8) * amplitude * 0.38;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`;
      });
      return points.join(' ');
    };

    const basePrimary = isEnergetic ? 42 : isFocus ? 32 : 24;
    const baseSecondary = isEnergetic ? 28 : isFocus ? 24 : 18;
    const baseSoft = isEnergetic ? 18 : isFocus ? 16 : 12;
    const primaryA = makeWavePath(basePrimary * bpmAmplitudeBoost, 0.52, 0);
    const primaryB = makeWavePath(
      (basePrimary + 4) * bpmAmplitudeBoost,
      0.52,
      1.6,
    );
    const secondaryA = makeWavePath(baseSecondary * bpmAmplitudeBoost, 0.38, 1);
    const secondaryB = makeWavePath(
      (baseSecondary + 6) * bpmAmplitudeBoost,
      0.38,
      2.8,
    );
    const softA = makeWavePath(baseSoft * bpmAmplitudeBoost, 0.28, 2.2);
    const softB = makeWavePath((baseSoft + 4) * bpmAmplitudeBoost, 0.28, 4);

    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 460,
          height: 190,
          borderRadius: 16,
          background:
            'linear-gradient(180deg, rgba(15,23,42,0.78), rgba(5,8,15,0.76))',
          border: `1px solid ${tone.primary}28`,
          boxShadow: `0 24px 70px ${tone.glow}`,
          overflow: 'hidden',
        }}
      >
        <style>{VISUALIZER_CSS}</style>
        <svg
          viewBox='0 0 560 180'
          preserveAspectRatio='none'
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <defs>
            <linearGradient
              id='audioWaveGradient'
              x1='0'
              y1='0'
              x2='1'
              y2='0'
            >
              <stop
                offset='0%'
                stopColor={tone.secondary}
                stopOpacity='0.1'
              />
              <stop
                offset='48%'
                stopColor={tone.primary}
                stopOpacity='1'
              />
              <stop
                offset='100%'
                stopColor={tone.secondary}
                stopOpacity='0.1'
              />
            </linearGradient>
          </defs>
          <g
            className='audio-wave-layer'
            style={{ '--wave-speed': speed } as CSSProperties}
          >
            <path
              d={softA}
              fill='none'
              stroke={tone.secondary}
              strokeWidth='2'
              opacity='0.38'
            >
              <animate
                attributeName='d'
                dur={speed}
                repeatCount='indefinite'
                values={`${softA};${softB};${softA}`}
              />
            </path>
            <path
              d={secondaryA}
              fill='none'
              stroke={tone.secondary}
              strokeWidth='4'
              strokeLinecap='round'
              opacity='0.52'
            >
              <animate
                attributeName='d'
                dur={speed}
                repeatCount='indefinite'
                values={`${secondaryA};${secondaryB};${secondaryA}`}
              />
            </path>
            <path
              className='audio-wave-primary'
              d={primaryA}
              fill='none'
              stroke='url(#audioWaveGradient)'
              strokeWidth='9'
              strokeLinecap='round'
              style={
                {
                  filter: `drop-shadow(0 0 16px ${tone.primary})`,
                  '--wave-speed': speed,
                } as CSSProperties
              }
            >
              <animate
                attributeName='d'
                dur={speed}
                repeatCount='indefinite'
                values={`${primaryA};${primaryB};${primaryA}`}
              />
            </path>
          </g>
        </svg>
        <div
          style={{
            position: 'absolute',
            left: 26,
            right: 26,
            bottom: 18,
            height: 2,
            borderRadius: 999,
            background:
              safeBpm != null
                ? `linear-gradient(90deg, transparent, ${tone.primary}, transparent)`
                : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)',
            opacity: safeBpm != null ? 0.45 : 0.18,
            animation:
              safeBpm != null
                ? `waveGlow ${speed} ease-in-out infinite`
                : 'none',
          }}
        />
      </div>
    );
  };

  // Right panel tabs
  const rightTabs: Array<{ key: PanelView; label: string; badge?: number }> = [
    { key: 'queue', label: 'Queue', badge: queueItems.length || undefined },
    { key: 'ai', label: 'AI Scores' },
    { key: 'settings', label: 'Settings' },
  ];

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
              color: '#b7adb0',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 2,
              fontWeight: 700,
            }}
          >
            Queue Management
          </div>
          <div style={{ color: '#857b80', fontSize: 12, marginTop: 2 }}>
            {queueItems.length} tracks in queue
          </div>
        </div>
        <Space size={12}>
          <button
            onClick={handleClearQueue}
            disabled={queueItems.length === 0 || clearQueue.isPending}
            style={{
              background: 'transparent',
              border: '1px solid rgba(239,68,68,0.3)',
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
              background: playerTheme.color,
              border: 'none',
              color: '#fff',
              padding: '6px 16px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: `0 4px 16px ${playerTheme.color}44`,
              transition: 'all 0.2s',
            }}
          >
            + Add Track
          </button>
        </Space>
      </Flex>
      <SimpleBar
        style={{
          flex: 1,
          maxHeight: isFull ? 'calc(100vh - 330px)' : 360,
          overflowX: 'hidden',
        }}
        autoHide={false}
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

  // ─── Sparkline generator (Real Data + Business Phase) ────────────────────
  const makeSparkline = (
    history: number[],
    currentPct: number,
    color: string,
    moodType: string,
    w = 120,
    h = 36,
  ) => {
    // Different baselines based on mood type to reflect typical shop behavior
    const baselines: Record<string, number[]> = {
      chill: [60, 70, 50, 30, 20, 15, 20, 30, 40, 30, 40, 60, 70, 80, 85, 90], // High early/late
      focus: [20, 30, 60, 80, 70, 50, 40, 60, 80, 70, 40, 30, 20, 15, 10, 5], // High mid-day
      energetic: [
        5, 10, 20, 40, 70, 90, 85, 70, 60, 85, 95, 80, 60, 40, 20, 10,
      ], // High peak/lunch
    };

    const baseline = baselines[moodType.toLowerCase()] || baselines.chill;

    // Merge real history with baseline for "context"
    const displayPoints =
      history.length > 5 ? history : [...baseline.slice(0, 8), currentPct];

    const minV = 0;
    const xStep = w / (displayPoints.length - 1);
    const coords = displayPoints.map((p, i) => [
      i * xStep,
      h - ((p - minV) / 100) * (h - 4) - 2,
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
        {/* Baseline guide line - very subtle */}
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

        {/* Pulsing current point */}
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

  // Confidence arc gauge
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
          stroke='#18181b'
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
          fill='#fff'
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

  // Mood card with sparkline
  const MoodCard = ({
    label,
    pct,
    color,
    icon,
  }: {
    label: string;
    pct: number;
    color: string;
    icon: string;
  }) => {
    const isActive = spaceState?.moodName
      ?.toLowerCase()
      .includes(label.toLowerCase());
    return (
      <div
        style={{
          background: isActive ? `${color}12` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${isActive ? `${color}44` : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 14,
          padding: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `${color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              {icon}
            </div>
            <div>
              <div style={{ color: '#f8f7f7', fontSize: 15, fontWeight: 700 }}>
                {label}
              </div>
              {isActive && (
                <div
                  style={{
                    background: `${color}33`,
                    color,
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: 4,
                    display: 'inline-block',
                    textTransform: 'uppercase',
                    marginTop: 2,
                  }}
                >
                  Active Mood
                </div>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color, fontSize: 24, fontWeight: 900 }}>{pct}%</span>
          </div>
        </div>
        <div
          style={{
            height: 6,
            background: '#18181b',
            borderRadius: 3,
            overflow: 'hidden',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: 3,
              background: `linear-gradient(90deg, ${color}, ${color}99)`,
              transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: `0 0 8px ${color}44`,
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                color: '#857b80',
                fontSize: 10,
                marginBottom: 4,
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Daily Phase Trend
            </div>
            {makeSparkline(
              label === 'Chill'
                ? scoreHistory.chill
                : label === 'Focus'
                  ? scoreHistory.focus
                  : scoreHistory.energetic,
              pct,
              color,
              label,
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#4b5563', fontSize: 10, fontWeight: 500 }}>
              Shop Hours
            </div>
            <div style={{ color: '#857b80', fontSize: 9 }}>06:00 - 23:00</div>
          </div>
        </div>
      </div>
    );
  };

  const renderAIScores = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Confidence Gauge */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
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
              color: '#b7adb0',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              marginBottom: 6,
            }}
          >
            AI Confidence
          </div>
          <div style={{ color: '#b7adb0', fontSize: 13, lineHeight: 1.5 }}>
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
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
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

      {/* Mood Cards */}
      <div>
        <div
          style={{
            color: '#b7adb0',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginBottom: 12,
          }}
        >
          Mood Distribution
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <MoodCard
            label='Chill'
            pct={chillPct}
            color='#10b981'
            icon='🌿'
          />
          <MoodCard
            label='Focus'
            pct={focusPct}
            color='#3b82f6'
            icon='🎯'
          />
          <MoodCard
            label='Energetic'
            pct={energPct}
            color='#f59e0b'
            icon='⚡'
          />
        </div>
      </div>

      {/* Signal Impact Breakdown */}
      <div>
        <div
          style={{
            color: '#b7adb0',
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
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '16px',
          }}
        >
          {(() => {
            const icons: Record<string, string> = {
              crowdPressure: '👥',
              ambientNoise: '🔊',
              timeOfDay: '⏰',
              dayOfWeek: '📅',
              businessPhase: '🏪',
              crowd_pressure: '👥',
              ambient_noise: '🔊',
              time_of_day: '⏰',
              day_of_week: '📅',
              business_phase: '🏪',
            };
            const labels: Record<string, string> = {
              crowdPressure: 'Crowd Pressure',
              ambientNoise: 'Ambient Noise',
              timeOfDay: 'Time of Day',
              dayOfWeek: 'Day of Week',
              businessPhase: 'Business Phase',
              crowd_pressure: 'Crowd Pressure',
              ambient_noise: 'Ambient Noise',
              time_of_day: 'Time of Day',
              day_of_week: 'Day of Week',
              business_phase: 'Business Phase',
            };

            // Map real contributions to our UI
            const coreSignals = realContributions.map((c) => {
              const raw = c.signal || '';
              const matched = raw.match(/^([^(]+)\((.*)\)$/);
              const name = matched ? matched[1].trim() : raw;
              const value = matched ? matched[2].trim() : 'N/A';

              const impacts = [];
              if (c.chillDelta !== 0 && c.chillDelta != null)
                impacts.push({ mood: 'Chill', delta: c.chillDelta });
              if (c.focusDelta !== 0 && c.focusDelta != null)
                impacts.push({ mood: 'Focus', delta: c.focusDelta });
              if (c.energeticDelta !== 0 && c.energeticDelta != null)
                impacts.push({ mood: 'Energetic', delta: c.energeticDelta });

              return {
                name,
                label: labels[name] || name,
                value,
                icon: icons[name] || '📡',
                impacts,
              };
            });

            if (coreSignals.length === 0) {
              return (
                <div
                  style={{
                    color: '#4b5563',
                    fontSize: 12,
                    textAlign: 'center',
                    padding: '20px 0',
                  }}
                >
                  No live signal data available
                </div>
              );
            }

            return coreSignals.slice(0, 5).map((sig, i) => (
              <div
                key={sig.name + i}
                style={{
                  marginBottom:
                    i === Math.min(coreSignals.length, 5) - 1 ? 0 : 16,
                  paddingBottom:
                    i === Math.min(coreSignals.length, 5) - 1 ? 0 : 16,
                  borderBottom:
                    i === Math.min(coreSignals.length, 5) - 1
                      ? 'none'
                      : '1px solid rgba(255,255,255,0.05)',
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
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <span style={{ fontSize: 16 }}>{sig.icon}</span>
                    <span
                      style={{
                        color: '#b7adb0',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {sig.label}
                    </span>
                    <span style={{ color: '#857b80', fontSize: 11 }}>
                      ({sig.value})
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {sig.impacts.length > 0 ? (
                    sig.impacts.map((imp) => (
                      <div
                        key={imp.mood}
                        style={{
                          fontSize: 10,
                          background:
                            imp.delta > 0
                              ? 'rgba(16,185,129,0.1)'
                              : 'rgba(239,68,68,0.1)',
                          color: imp.delta > 0 ? '#10b981' : '#ef4444',
                          padding: '2px 8px',
                          borderRadius: 4,
                          border:
                            imp.delta > 0
                              ? '1px solid rgba(16,185,129,0.2)'
                              : '1px solid rgba(239,68,68,0.2)',
                        }}
                      >
                        {imp.mood} {imp.delta > 0 ? '×' : '÷'}{' '}
                        {Math.abs(imp.delta * 10).toFixed(1)}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 10, color: '#4b5563' }}>
                      No direct impact on mood scores
                    </div>
                  )}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Signal Analysis (Full Table) */}
      {spaceState && (
        <div>
          <div
            style={{
              color: '#b7adb0',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              marginBottom: 12,
            }}
          >
            Technical Signal Analysis
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
            }}
          >
            <AIExplainabilityPanel
              spaceState={spaceState}
              compact
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div>
      <Text
        style={{
          color: '#b7adb0',
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

  // ─── Shared player props ──────────────────────────────────────────────────
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

  // ─── Status banner ────────────────────────────────────────────────────────
  const renderStatusBanner = () =>
    spaceState?.isManualOverride || spaceState?.isScheduling ? (
      <div
        style={{
          padding: '8px 24px',
          fontSize: 12,
          background: spaceState?.isManualOverride
            ? 'rgba(245,158,11,0.15)'
            : 'rgba(59,130,246,0.15)',
          borderBottom: `1px solid ${spaceState?.isManualOverride ? '#78350f66' : '#1e3a5f66'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {spaceState?.isManualOverride ? (
          <>
            <Tag
              color='warning'
              style={{ margin: 0, fontWeight: 700, fontSize: 11 }}
            >
              MANUAL OVERRIDE
            </Tag>
            {manualOverrideRemainingSeconds != null && (
              <Tag
                color='red'
                style={{ margin: 0 }}
              >
                TTL {formatPlaybackTime(manualOverrideRemainingSeconds)}
              </Tag>
            )}
          </>
        ) : (
          <>
            <Tag
              color='processing'
              style={{ margin: 0, fontWeight: 700, fontSize: 11 }}
            >
              SCHEDULING ACTIVE
            </Tag>
            {schedulingRemainingSeconds != null && (
              <Tag
                color='cyan'
                style={{ margin: 0 }}
              >
                Ends in {formatPlaybackTime(schedulingRemainingSeconds)}
              </Tag>
            )}
          </>
        )}
      </div>
    ) : null;

  // ─── FULL / KIOSK LAYOUT ─────────────────────────────────────────────────
  if (isFull) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f0f11 0%, #0f0f11 100%)',
          height: '100%',
          minHeight: 300,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        {renderStatusBanner()}
        <div
          style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}
        >
          {/* ── LEFT: Circular player + controls ── */}
          <div
            style={{
              flex: '0 0 520px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              overflow: 'hidden',
              padding: '46px 40px 28px',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              background:
                'radial-gradient(circle at 50% 28%, rgba(59,130,246,0.14) 0%, rgba(17,16,28,0.86) 38%, rgba(10,10,12,0.98) 76%)',
            }}
          >
            {/* Space name header */}
            <div style={{ width: '100%', marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <SoundOutlined
                  style={{ color: playerTheme.colorSoft, fontSize: 18 }}
                />
                <Text
                  style={{ color: '#f8f7f7', fontSize: 18, fontWeight: 700 }}
                >
                  {space.name}
                </Text>
              </div>
              {spaceState?.moodName && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: playerTheme.bg,
                    border: `1px solid ${playerTheme.color}66`,
                  }}
                >
                  <EyeOutlined
                    style={{ color: playerTheme.colorSoft, fontSize: 12 }}
                  />
                  <span
                    style={{
                      color: playerTheme.colorSoft,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {spaceState.moodName}
                  </span>
                </div>
              )}
            </div>

            {/* Circular BPM orb */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 170,
                marginBottom: 26,
              }}
            >
              {/* Outer glow rings */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 24,
                  background: `radial-gradient(circle, ${playerTheme.shadow} 0%, transparent 70%)`,
                  animation: isPlaying
                    ? 'pulse 3s ease-in-out infinite'
                    : 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 22,
                  overflow: 'hidden',
                  background: `radial-gradient(circle at 40% 35%, ${playerTheme.color}3f 0%, ${playerTheme.color}1c 42%, rgba(15,23,42,0.92) 100%)`,
                  border: `1px solid ${playerTheme.color}26`,
                  boxShadow: isPlaying
                    ? `0 0 52px ${playerTheme.color}55, 0 0 100px ${playerTheme.color}1f, inset 0 0 40px rgba(0,0,0,0.5)`
                    : `0 0 30px ${playerTheme.color}22, inset 0 0 40px rgba(0,0,0,0.5)`,
                  transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Wave lines decoration */}
                <div
                  style={{
                    position: 'absolute',
                    display: 'none',
                    left: 22,
                    right: 22,
                    top: '50%',
                    height: 1,
                    borderRadius: 0,
                    border: 0,
                    background:
                      'linear-gradient(90deg, transparent, rgba(129,140,248,0.24), transparent)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    display: 'none',
                  }}
                />

                {/* BPM / Visualizer content */}
                <div
                  style={{
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                  }}
                >
                  {space.id ? (
                    renderMoodVisualizer()
                  ) : bpmTarget !== null ? (
                    <>
                      <div
                        style={{
                          color: '#a5b4fc',
                          fontSize: 13,
                          marginBottom: 4,
                        }}
                      >
                        Target: {bpmTarget}
                      </div>
                      <div
                        style={{
                          color: '#fff',
                          fontSize: 40,
                          fontWeight: 800,
                          lineHeight: 1,
                          letterSpacing: -1,
                        }}
                      >
                        {bpmMin}–{bpmMax}
                      </div>
                      <div
                        style={{ color: '#857b80', fontSize: 12, marginTop: 4 }}
                      >
                        BPM range
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      {currentCoverImageUrl ? (
                        <img
                          src={currentCoverImageUrl}
                          alt='cover'
                          style={{
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <SoundOutlined
                          style={{
                            fontSize: 56,
                            color: isPlaying
                              ? playerTheme.colorSoft
                              : '#374151',
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Playback pulse is handled by the waveform itself. */}
            </div>

            {/* Track name */}
            <div
              style={{ textAlign: 'center', marginBottom: 20, width: '100%' }}
            >
              <div
                style={{
                  color: '#f8f7f7',
                  fontSize: 20,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: 8,
                }}
              >
                {spaceState?.currentTrackName || 'No track playing'}
              </div>

              {/* Progress Slider */}
              <div
                style={{ width: '100%', padding: '0 20px', marginBottom: 20 }}
              >
                <Slider
                  value={duration > 0 ? (currentTime / duration) * 100 : 0}
                  onChange={(val) => handleSeek((val / 100) * duration)}
                  tooltip={{ formatter: () => formatPlaybackTime(currentTime) }}
                  styles={{
                    track: {
                      background: `linear-gradient(90deg, ${playerTheme.color}, ${playerTheme.colorSoft})`,
                    },
                    handle: {
                      background: '#fff',
                      border: 'none',
                      boxShadow: `0 0 10px ${playerTheme.color}`,
                    },
                  }}
                />
                <Flex
                  justify='space-between'
                  style={{ marginTop: -8 }}
                >
                  <Text style={{ color: '#857b80', fontSize: 11 }}>
                    {formatPlaybackTime(currentTime)}
                  </Text>
                  <Text style={{ color: '#857b80', fontSize: 11 }}>
                    {formatPlaybackTime(duration)}
                  </Text>
                </Flex>
              </div>

              {spaceState?.fuzzyReason && (
                <div
                  style={{
                    color: '#b7adb0',
                    fontSize: 13,
                    background: 'rgba(255,255,255,0.05)',
                    padding: '6px 12px',
                    borderRadius: 8,
                    display: 'inline-block',
                  }}
                >
                  {spaceState.fuzzyReason}
                </div>
              )}
            </div>

            {/* Controls pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 24px',
                borderRadius: 50,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <RepeatButton
                queueEndBehavior={spaceState?.queueEndBehavior ?? 0}
                onChange={(next) =>
                  handleQueueEndBehaviorChange(next as QueueEndBehavior)
                }
                size={18}
                className='text-gray-400 hover:text-gray-200'
              />

              <div
                style={{
                  width: 1,
                  height: 20,
                  background: 'rgba(255,255,255,0.1)',
                  margin: '0 4px',
                }}
              />

              <button
                onClick={handleSkipPrevious}
                disabled={isPending}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'none',
                  transition: 'all 0.2s',
                  opacity: isPending ? 0.4 : 1,
                  transform: 'scale(1)',
                }}
              >
                <StepBackwardOutlined />
              </button>

              <button
                onClick={handleRewind10}
                disabled={isPending}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'none',
                  transition: 'all 0.2s',
                  opacity: isPending ? 0.4 : 1,
                  transform: 'scale(1)',
                }}
              >
                <FastBackwardOutlined style={{ fontSize: 14 }} />
              </button>

              <button
                onClick={handlePlayPause}
                disabled={isPending}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  background: `linear-gradient(135deg, ${playerTheme.color}, #2563eb)`,
                  color: '#fff',
                  fontSize: 26,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 28px ${playerTheme.color}66`,
                  transition: 'all 0.2s',
                  opacity: isPending ? 0.4 : 1,
                  transform: 'scale(1)',
                }}
              >
                {isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              </button>

              <button
                onClick={handleForward10}
                disabled={isPending}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'none',
                  transition: 'all 0.2s',
                  opacity: isPending ? 0.4 : 1,
                  transform: 'scale(1)',
                }}
              >
                <FastForwardOutlined style={{ fontSize: 14 }} />
              </button>

              <button
                onClick={handleSkipNext}
                disabled={isPending}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'none',
                  transition: 'all 0.2s',
                  opacity: isPending ? 0.4 : 1,
                  transform: 'scale(1)',
                }}
              >
                <StepForwardOutlined />
              </button>

              <div
                style={{
                  width: 1,
                  height: 20,
                  background: 'rgba(255,255,255,0.1)',
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
                      background: 'rgba(20,20,30,0.95)',
                      borderRadius: 16,
                      padding: '12px 0',
                      border: '1px solid rgba(255,255,255,0.1)',
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
                <button
                  onClick={handleToggleMute}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    fontSize: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'none',
                    transition: 'all 0.2s',
                    opacity: 1,
                    transform: 'scale(1)',
                  }}
                >
                  {spaceState?.isMuted ? (
                    <MutedOutlined style={{ color: '#ef4444' }} />
                  ) : (
                    <SoundOutlined />
                  )}
                </button>
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
              background: 'rgba(0,0,0,0.3)',
            }}
          >
            {/* Tab bar */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
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
                    color: panel === tab.key ? '#818cf8' : '#4b5563',
                    fontSize: 14,
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    borderBottom:
                      panel === tab.key
                        ? '2px solid #818cf8'
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
                        background: '#7c3aed',
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
          .simplebar-track.simplebar-horizontal {
            display: none !important;
          }
          .simplebar-content-wrapper {
            overflow-x: hidden !important;
          }
        `}</style>
      </div>
    );
  }

  // ─── CARD LAYOUT (for modal/embedded use) ────────────────────────────────
  const cardTabs: Array<{
    key: PanelView;
    icon: ReactNode;
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
        background: '#0f0f11',
        borderRadius: 16,
        overflow: 'hidden',
        minHeight: 480,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {renderStatusBanner()}
      <div
        style={{
          padding: '24px 20px 16px',
          background:
            'linear-gradient(180deg, rgba(99,102,241,0.1) 0%, transparent 100%)',
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
              background: `radial-gradient(circle at 40% 35%, ${theme.color}66 0%, rgba(15,23,42,0.9) 100%)`,
              border: `1px solid ${theme.color}44`,
              boxShadow: isPlaying
                ? `0 0 40px ${theme.color}66`
                : '0 0 20px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.5s ease',
              position: 'relative',
            }}
          >
            {currentCoverImageUrl ? (
              <img
                src={currentCoverImageUrl}
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
                  color: isPlaying ? theme.color : '#374151',
                }}
              />
            )}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              color: '#f8f7f7',
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
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '4px 0',
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
              color: panel === tab.key ? theme.color : '#4b5563',
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
            <span style={{ fontSize: 10 }}>{tab.label}</span>
          </button>
        ))}
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
