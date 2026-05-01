import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router';
import {
  Badge,
  Col,
  Empty,
  message,
  Progress,
  Row,
  Segmented,
  Skeleton,
  Tag,
  Typography,
} from 'antd';
import {
  AudioOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  CustomerServiceOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LeftOutlined,
  MinusOutlined,
  MutedOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  RightOutlined,
  SoundOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  WalletOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import {
  BrandDashboardPeriodEnum,
  BrandStoreHealthStatusEnum,
  IotHealthStatusEnum,
  TrackScopeEnum,
  WalletLockStatusEnum,
  type BrandDashboardMetricTrend,
  type BrandDashboardIotSpaceHealthItem,
  type BrandDashboardTopTrackItem,
  type BrandLivePlaybackQueueItem,
  type BrandLivePlaybackSpaceItem,
} from '@/features/brand/types';
import {
  useBrandDashboard,
  useBrandDashboardRealtime,
} from '@/features/brand/hooks';
import {
  usePlaybackControl,
  useSpaceState,
  useUpdateAudioState,
} from '@/shared/modules/cams/hooks';
import {
  SpacePlayer,
  type SpacePlayerAudioAnalysis,
  type SpacePlayerHandle,
} from '@/shared/modules/cams/components';
import { SpaceMusicModal } from '@/features/store/pages/SpaceManagement/components';
import {
  canPlayCamsQueueItem,
  getCamsMoodTheme,
  getCamsQueueStatusLabel,
  getCamsQueueStatusTone,
  getEffectiveSeekOffset,
  isCamsQueueItemStatus,
} from '@/shared/modules/cams/utils';
import {
  PlaybackCommand,
  QueueItemStatus,
  type QueueEndBehavior,
  type SpaceStateDto,
  type SpaceStateResponse,
} from '@/shared/modules/cams/types';
import { storeHubService } from '@/shared/modules/cams/services/storeHubService';
import { SPACE_TYPE_LABELS } from '@/shared/modules/spaces/constants';

const { Title, Text } = Typography;
const PLAYBACK_UNLOCK_TOAST_KEY = 'brand-dashboard-playback-unlock';

const hasDocumentUserActivation = () => {
  if (typeof navigator === 'undefined') return true;

  const userActivation = (
    navigator as Navigator & {
      userActivation?: { hasBeenActive: boolean };
    }
  ).userActivation;

  return !userActivation || userActivation.hasBeenActive;
};

const EMPTY_LIVE_PLAYBACK_ITEMS: BrandLivePlaybackSpaceItem[] = [];
const EMPTY_IOT_SPACE_HEALTH_ITEMS: BrandDashboardIotSpaceHealthItem[] = [];
const DASHBOARD_KPI_CARD_HEIGHT = 140;

const C = {
  surface: '#18181b',
  surface2: '#202024',
  border: '#2d2528',
  borderSoft: 'rgba(255,255,255,0.07)',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  chill: '#10b981',
  orange: '#f59e0b',
  indigo: '#818cf8',
  text: '#f8f7f7',
  muted: '#b7adb0',
  subtle: '#857b80',
};

const panel = (minHeight?: number): React.CSSProperties => ({
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  minHeight,
  overflow: 'hidden',
});

const formatNumber = (value?: number | null) =>
  new Intl.NumberFormat('en-US').format(Math.round(value ?? 0));

const formatCompact = (value?: number | null) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value ?? 0);

const formatAgo = (value?: string | null) => {
  if (!value) return 'No data';
  const seconds = Math.max(0, dayjs().diff(dayjs(value), 'second'));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
};

const getComparisonLabel = (period?: BrandDashboardPeriodEnum) => {
  switch (period) {
    case BrandDashboardPeriodEnum.Day:
      return 'vs yesterday';
    case BrandDashboardPeriodEnum.Week:
      return 'vs last week';
    case BrandDashboardPeriodEnum.Month:
      return 'vs last month';
    case BrandDashboardPeriodEnum.Year:
      return 'vs last year';
    default:
      return 'vs previous period';
  }
};

const formatSigned = (value: number, suffix = '') => {
  if (value > 0) return `+${formatNumber(value)}${suffix}`;
  if (value < 0) return `-${formatNumber(Math.abs(value))}${suffix}`;
  return `0${suffix}`;
};

const formatTrendText = (
  trend?: BrandDashboardMetricTrend | null,
  comparisonLabel = 'vs previous period',
  mode: 'delta' | 'percent' = 'percent',
  noun?: string,
) => {
  if (!trend) return undefined;

  if (
    mode === 'percent' &&
    trend.percentChange !== null &&
    trend.percentChange !== undefined
  ) {
    return `${formatSigned(trend.percentChange, '%')} ${comparisonLabel}`;
  }

  const nounText = noun ? ` ${noun}` : '';
  return `${formatSigned(trend.delta)}${nounText} ${comparisonLabel}`;
};

const formatTokenUsageTrendText = (
  trend?: { delta: number } | null,
  comparisonLabel = 'vs previous period',
) => {
  if (!trend) return undefined;
  return `${formatSigned(trend.delta)} used ${comparisonLabel}`;
};

const formatPlayTrendText = (
  trend?: { delta: number } | null,
  comparisonLabel = 'vs previous period',
) => {
  if (!trend) return undefined;
  return `${formatSigned(trend.delta)} plays ${comparisonLabel}`;
};

type TrendDirection = 'up' | 'down' | 'flat';

const getTrendDirection = (value?: number | null): TrendDirection => {
  if (!value) return 'flat';
  return value > 0 ? 'up' : 'down';
};

const getTrendTone = (value?: number | null) => {
  if (!value) return C.subtle;
  return value > 0 ? C.green : C.red;
};

const getUsageTrendTone = (value?: number | null) => {
  if (!value) return C.subtle;
  return value > 0 ? C.red : C.green;
};

const TrendIcon = ({ direction }: { direction: TrendDirection }) => {
  if (direction === 'up') return <ArrowUpOutlined />;
  if (direction === 'down') return <ArrowDownOutlined />;
  return <MinusOutlined />;
};

const getIotMeta = (status?: IotHealthStatusEnum) => {
  switch (status) {
    case IotHealthStatusEnum.Online:
      return { label: 'Online', color: C.green, tag: 'success' as const };
    case IotHealthStatusEnum.Offline:
      return { label: 'Offline', color: C.red, tag: 'error' as const };
    case IotHealthStatusEnum.Stale:
      return { label: 'Stale', color: C.orange, tag: 'warning' as const };
    case IotHealthStatusEnum.NoDevice:
      return { label: 'No device', color: C.subtle, tag: 'default' as const };
    default:
      return { label: 'Unknown', color: C.subtle, tag: 'default' as const };
  }
};

const getIotStatusFromSpaceState = (state?: SpaceStateDto | null) => {
  if (!state) return undefined;
  if (state.isIotDeviceAssigned === false) return IotHealthStatusEnum.NoDevice;
  return state.isIotDeviceOffline
    ? IotHealthStatusEnum.Offline
    : IotHealthStatusEnum.Online;
};
const Panel = ({
  title,
  extra,
  children,
  minHeight,
  viewPath,
  style,
  contentStyle,
}: {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
  minHeight?: number;
  viewPath?: string;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
}) => {
  const navigate = useNavigate();

  return (
    <section
      style={{
        ...panel(minHeight),
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '13px 14px 0',
        }}
      >
        <Text style={{ color: C.text, fontSize: 13, fontWeight: 800 }}>
          {title}
        </Text>
        {extra ??
          (viewPath ? (
            <button
              onClick={() => navigate(viewPath)}
              style={{
                border: 0,
                background: 'transparent',
                color: '#60a5fa',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              View all
            </button>
          ) : (
            <Text style={{ color: '#60a5fa', fontSize: 11, fontWeight: 800 }}>
              View all
            </Text>
          ))}
      </div>
      <div style={{ padding: 14, flex: 1, ...contentStyle }}>{children}</div>
    </section>
  );
};

const TrendLine = ({
  text,
  tone,
  direction,
}: {
  text: string;
  tone: string;
  direction: TrendDirection;
}) => (
  <Text
    style={{
      color: tone,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 10,
      fontWeight: 800,
      marginTop: 3,
    }}
  >
    <TrendIcon direction={direction} />
    <span>{text}</span>
  </Text>
);

const KpiCard = ({
  icon,
  label,
  value,
  detail,
  trendText,
  trendTone = C.subtle,
  trendDirection = 'flat',
  accent = C.red,
  loading,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail?: string;
  trendText?: string;
  trendTone?: string;
  trendDirection?: TrendDirection;
  accent?: string;
  loading?: boolean;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    style={{
      ...panel(),
      boxSizing: 'border-box',
      height: DASHBOARD_KPI_CARD_HEIGHT,
      padding: 15,
      cursor: onClick ? 'pointer' : 'default',
    }}
  >
    <div style={{ display: 'flex', gap: 12 }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: `${accent}1f`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <Text style={{ color: C.muted, fontSize: 11, fontWeight: 800 }}>
          {label}
        </Text>
        <div style={{ marginTop: 7 }}>
          {loading ? (
            <Skeleton.Input
              active
              size='small'
              style={{ width: 78 }}
            />
          ) : (
            <span style={{ color: C.text, fontSize: 25, fontWeight: 900 }}>
              {value}
            </span>
          )}
        </div>
        {detail ? (
          <Text style={{ color: C.subtle, fontSize: 11 }}>{detail}</Text>
        ) : null}
        {trendText ? (
          <TrendLine
            text={trendText}
            tone={trendTone}
            direction={trendDirection}
          />
        ) : null}
      </div>
    </div>
  </div>
);

const IotKpiCard = ({
  totalSpaces,
  online,
  offline,
  stale,
  unknown,
  trendText,
  trendTone = C.green,
  trendDirection = 'flat',
  loading,
  onClick,
}: {
  totalSpaces?: number | null;
  online?: number | null;
  offline?: number | null;
  stale?: number | null;
  unknown?: number | null;
  trendText?: string;
  trendTone?: string;
  trendDirection?: TrendDirection;
  loading?: boolean;
  onClick?: () => void;
}) => {
  const total = totalSpaces ?? 0;
  const onlineCount = online ?? 0;
  const offlineCount = offline ?? 0;
  const staleCount = stale ?? 0;
  const unknownCount = unknown ?? 0;
  const percent = total > 0 ? Math.round((onlineCount / total) * 100) : 0;

  return (
    <div
      onClick={onClick}
      style={{
        ...panel(),
        boxSizing: 'border-box',
        height: DASHBOARD_KPI_CARD_HEIGHT,
        padding: 13,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: `${C.green}1f`,
                color: C.green,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WifiOutlined />
            </div>
            <Text style={{ color: C.muted, fontSize: 11, fontWeight: 900 }}>
              IoT Health
            </Text>
          </div>
          <div style={{ marginTop: 7 }}>
            {loading ? (
              <Skeleton.Input
                active
                size='small'
                style={{ width: 78 }}
              />
            ) : (
              <span style={{ color: C.text, fontSize: 24, fontWeight: 950 }}>
                {formatNumber(onlineCount)}
              </span>
            )}
            <Text style={{ color: C.subtle, fontSize: 11, marginLeft: 4 }}>
              / {formatNumber(total)}
            </Text>
          </div>
          <div
            style={{ display: 'flex', gap: 9, marginTop: 8, flexWrap: 'wrap' }}
          >
            {[
              { label: 'Online', value: onlineCount, color: C.green },
              { label: 'Offline', value: offlineCount, color: C.red },
              { label: 'Stale', value: staleCount, color: C.orange },
              { label: 'Unknown', value: unknownCount, color: C.subtle },
            ].map((item) => (
              <span
                key={item.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: C.subtle,
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 99,
                    background: item.color,
                  }}
                />
                {item.value}
              </span>
            ))}
          </div>
          {trendText ? (
            <TrendLine
              text={trendText}
              tone={trendTone}
              direction={trendDirection}
            />
          ) : null}
        </div>
        <Progress
          type='circle'
          percent={percent}
          size={58}
          strokeColor={C.green}
          railColor='rgba(255,255,255,.08)'
          format={() => (
            <span style={{ color: C.text, fontSize: 12, fontWeight: 900 }}>
              {percent}%
            </span>
          )}
        />
      </div>
    </div>
  );
};

const WaveVisualizer = ({
  color,
  playing,
  analysis,
}: {
  color: string;
  playing: boolean;
  analysis: SpacePlayerAudioAnalysis;
}) => {
  const energy = playing ? analysis.energy : 0;
  const bass = playing ? analysis.bass : 0;
  const treble = playing ? analysis.treble : 0;
  const beat = playing ? analysis.beat : 0;
  const beatStrength = playing ? analysis.beatStrength : 0;
  const waveOpacity = playing ? 0.36 + energy * 0.28 : 0.2;
  const bassPunch = bass * 40 + beat * 22 + beatStrength * 32;
  const trebleRipple = treble * 24 + beatStrength * 8;
  const tempoPhase = (analysis.beatId % 6) * 0.55;
  const glow = 8 + energy * 24 + bass * 20 + beatStrength * 16 + beat * 10;
  const buildWavePath = (index: number) => {
    const baseY = 88 + index * 16;
    const layer = index + 1;
    const crest = 34 + index * 10 - bassPunch * (0.82 - index * 0.08);
    const valley = 144 + index * 8 + bassPunch * (0.64 - index * 0.06);
    const midLift = Math.sin(tempoPhase + layer) * trebleRipple;
    const lateLift = Math.cos(tempoPhase * 1.2 + layer) * trebleRipple * 0.75;

    return `M0 ${baseY}
      C72 ${crest + lateLift}, 126 ${crest - midLift}, 190 ${baseY + midLift}
      S304 ${valley - lateLift}, 390 ${baseY - midLift}
      S520 ${crest + midLift}, 620 ${baseY + lateLift}
      S760 ${valley + midLift}, 860 ${baseY - lateLift}
      S930 ${50 + index * 9 - bassPunch * 0.32}, 980 ${baseY}`;
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        borderRadius: 8,
        opacity: waveOpacity,
        pointerEvents: 'none',
      }}
    >
      <style>{`
      @keyframes bmWaveGlow { 0%,100% { opacity: .42; } 50% { opacity: .95; } }
      @keyframes bmDiscPulse { 0%,100% { transform: scale(.96); opacity: .48; } 50% { transform: scale(1.05); opacity: .95; } }
      @keyframes bmCoverBeatBump { 0% { transform: scale(1); } 24% { transform: scale(var(--cover-beat-scale, 1.18)) translateY(var(--cover-beat-lift, -2px)); } 62% { transform: scale(.975); } 100% { transform: scale(1); } }
      .brand-live-cover.beat-bump { animation: bmCoverBeatBump 260ms cubic-bezier(.16,.82,.25,1.08); will-change: transform; }
    `}</style>
      <div
        style={{
          position: 'absolute',
          left: '15%',
          top: '22%',
          width: '28%',
          height: '48%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}44 0%, ${color}1f 38%, transparent 70%)`,
          filter: `blur(${6 + bass * 9 + beatStrength * 4}px)`,
          transform: `scale(${1 + energy * 0.18 + bass * 0.12 + beatStrength * 0.07})`,
          transition: 'transform 80ms linear, filter 80ms linear',
        }}
      />
      <svg
        viewBox='0 0 980 220'
        preserveAspectRatio='none'
        style={{
          position: 'absolute',
          left: '-7%',
          right: '-7%',
          top: '18%',
          width: '114%',
          height: '54%',
        }}
      >
        <defs>
          <linearGradient
            id='bmWaveGradient'
            x1='0'
            x2='1'
            y1='0'
            y2='0'
          >
            <stop
              offset='0'
              stopColor={color}
              stopOpacity='.08'
            />
            <stop
              offset='.28'
              stopColor={color}
              stopOpacity={0.64 + bass * 0.34}
            />
            <stop
              offset='.5'
              stopColor={color}
              stopOpacity={0.18 + treble * 0.32}
            />
            <stop
              offset='.72'
              stopColor={color}
              stopOpacity={0.64 + bass * 0.34}
            />
            <stop
              offset='1'
              stopColor={color}
              stopOpacity='.08'
            />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={buildWavePath(i)}
            fill='none'
            stroke='url(#bmWaveGradient)'
            strokeWidth={
              (i === 1 ? 2.8 : 1.8) + bass * 3.3 + beatStrength * 1.55
            }
            strokeLinecap='round'
            style={{
              filter: `drop-shadow(0 0 ${glow}px ${color}88)`,
              transition:
                'd 55ms linear, stroke-width 55ms linear, filter 55ms linear',
              animation: playing
                ? `bmWaveGlow ${1.4 + i * 0.18}s ease-in-out infinite`
                : undefined,
            }}
          />
        ))}
      </svg>
    </div>
  );
};

const formatDuration = (seconds?: number | null) => {
  const safeSeconds = Math.max(0, Math.floor(seconds ?? 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getPlaybackDurationSeconds = (space: BrandLivePlaybackSpaceItem) => {
  if (!space.startedAtUtc || !space.expectedEndAtUtc) return 0;
  return Math.max(
    0,
    dayjs(space.expectedEndAtUtc).diff(dayjs(space.startedAtUtc), 'second'),
  );
};

const getPlaybackElapsedSeconds = (
  space: BrandLivePlaybackSpaceItem,
  _nowMs: number,
  state?: SpaceStateDto | null,
) => {
  return getEffectiveSeekOffset(
    state ?? {
      isPaused: space.isPaused,
      pausePositionSeconds: null,
      seekOffsetSeconds: null,
      startedAtUtc: space.startedAtUtc ?? null,
      expectedEndAtUtc: space.expectedEndAtUtc ?? null,
    },
    storeHubService.serverClockOffsetMs,
  );
};

const getProgress = (
  space: BrandLivePlaybackSpaceItem,
  nowMs: number,
  state?: SpaceStateDto | null,
) => {
  const duration = getPlaybackDurationSeconds(space);
  if (duration <= 0) return 0;
  return Math.max(
    0,
    Math.min(
      100,
      (getPlaybackElapsedSeconds(space, nowMs, state) / duration) * 100,
    ),
  );
};

const buildQueueRows = (
  space: BrandLivePlaybackSpaceItem,
  topTracks: BrandDashboardTopTrackItem[],
): BrandLivePlaybackQueueItem[] => {
  const explicit = space.queueItems?.filter(Boolean) ?? [];
  if (explicit.length) {
    return [...explicit].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }
  const rows: BrandLivePlaybackQueueItem[] = [
    {
      queueItemId: space.trackId ?? space.spaceId,
      trackId: space.trackId,
      trackName: space.trackName || 'No track playing',
      artist: space.artist,
      position: 1,
      queueStatus: 1,
    },
  ];
  topTracks
    .filter((track) => track.trackId !== space.trackId)
    .slice(0, 2)
    .forEach((track, index) =>
      rows.push({
        queueItemId: track.trackId ?? `${space.spaceId}-${index}`,
        trackId: track.trackId,
        trackName: track.trackName,
        artist: track.artist,
        position: index + 2,
        queueStatus: 0,
      }),
    );
  return rows;
};

const resolveQueueStatus = (
  queue: BrandLivePlaybackQueueItem,
  currentQueueItemId: string | null | undefined,
  index: number,
  allRows: BrandLivePlaybackQueueItem[],
): QueueItemStatus => {
  if (isCamsQueueItemStatus(queue.queueStatus)) {
    return queue.queueStatus;
  }

  if (queue.queueItemId && queue.queueItemId === currentQueueItemId) {
    return QueueItemStatus.Playing;
  }

  const hasExplicitStatuses = allRows.some((item) =>
    isCamsQueueItemStatus(item.queueStatus),
  );

  if (!hasExplicitStatuses && index === 0) {
    return QueueItemStatus.Playing;
  }

  return QueueItemStatus.Pending;
};

const mergeSpaceStateIntoPlayback = (
  space: BrandLivePlaybackSpaceItem,
  state?: SpaceStateDto | null,
): BrandLivePlaybackSpaceItem => {
  if (!state) return space;

  const queueItems =
    state.spaceQueueItems?.map((item) => {
      const queueItem = item as typeof item &
        Partial<BrandLivePlaybackQueueItem> & { orderIndex?: number | null };

      return {
        queueItemId: queueItem.queueItemId,
        trackId: queueItem.trackId,
        trackName: queueItem.trackName,
        position: queueItem.position ?? queueItem.orderIndex,
        queueStatus: queueItem.queueStatus,
        source: queueItem.source,
        hlsUrl: queueItem.hlsUrl,
        isReadyToStream: queueItem.isReadyToStream,
        coverImageUrl: queueItem.coverImageUrl,
      };
    }) ?? [];
  const currentQueueItem =
    queueItems.find((item) => item.queueItemId === state.currentQueueItemId) ??
    queueItems.find((item) => item.queueStatus === 1);

  return {
    ...space,
    trackId: currentQueueItem?.trackId ?? space.trackId,
    trackName:
      state.currentTrackName ?? currentQueueItem?.trackName ?? space.trackName,
    moodName: state.moodName ?? space.moodName,
    startedAtUtc: state.startedAtUtc ?? space.startedAtUtc,
    expectedEndAtUtc: state.expectedEndAtUtc ?? space.expectedEndAtUtc,
    isPaused: state.isPaused,
    isManualOverride: state.isManualOverride,
    volumePercent: state.volumePercent,
    isMuted: state.isMuted,
    queueItems: queueItems.length ? queueItems : space.queueItems,
  };
};

type LivePlaybackProps = {
  items: BrandLivePlaybackSpaceItem[];
  iotBySpace: Map<string, BrandDashboardIotSpaceHealthItem>;
  topTracks: BrandDashboardTopTrackItem[];
  loading?: boolean;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onPlaybackUnlockReady?: (handler: (() => void) | null) => void;
};

const LivePlayback = ({
  items,
  iotBySpace,
  topTracks,
  loading,
  activeIndex,
  onActiveIndexChange,
  onPlaybackUnlockReady,
}: LivePlaybackProps) => {
  const baseActive =
    items[Math.min(activeIndex, Math.max(items.length - 1, 0))];
  const { data: activeSpaceState } = useSpaceState(
    baseActive?.spaceId,
    Boolean(baseActive?.spaceId),
  );
  const active = baseActive
    ? mergeSpaceStateIntoPlayback(baseActive, activeSpaceState)
    : undefined;
  const playbackControl = usePlaybackControl();
  const updateAudio = useUpdateAudioState();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [musicModalOpen, setMusicModalOpen] = useState(false);
  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);
  const [playerDuration, setPlayerDuration] = useState(0);
  const [playerTimeUpdatedAtMs, setPlayerTimeUpdatedAtMs] = useState(0);
  const [isPlaybackExpanded, setIsPlaybackExpanded] = useState(false);
  const [playbackFocusPhase, setPlaybackFocusPhase] = useState<
    'idle' | 'entering' | 'open' | 'closing'
  >('idle');
  const [audioAnalysis, setAudioAnalysis] = useState<SpacePlayerAudioAnalysis>({
    energy: 0,
    bass: 0,
    treble: 0,
    beat: 0,
    beatId: 0,
    beatStrength: 0,
  });
  const hiddenPlayerRef = useRef<SpacePlayerHandle>(null);
  const coverArtRef = useRef<HTMLDivElement>(null);
  const playbackUnlockToastShownRef = useRef(false);
  const playbackFocusTimerRef = useRef<number | null>(null);
  const playbackFocusFrameRef = useRef<number | null>(null);
  const go = (dir: -1 | 1) =>
    items.length &&
    onActiveIndexChange((activeIndex + dir + items.length) % items.length);
  const activeSpaceId = active?.spaceId;
  const activeStartedAtUtc = active?.startedAtUtc;
  const activeExpectedEndAtUtc = active?.expectedEndAtUtc;
  const activeIsPaused = active?.isPaused ?? true;
  const handleAudioAnalysis = useCallback(
    (nextAnalysis: SpacePlayerAudioAnalysis) => {
      setAudioAnalysis(nextAnalysis);
    },
    [],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNowMs(Date.now());
      setPlayerCurrentTime(0);
      setPlayerDuration(0);
      setPlayerTimeUpdatedAtMs(0);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeSpaceId, activeSpaceState?.currentQueueItemId]);

  useEffect(() => {
    if (!activeSpaceId || activeIsPaused) return undefined;

    const initialTick = window.setTimeout(() => setNowMs(Date.now()), 0);
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(timer);
    };
  }, [
    activeSpaceId,
    activeStartedAtUtc,
    activeExpectedEndAtUtc,
    activeIsPaused,
  ]);

  const mood = getCamsMoodTheme(active?.moodName);
  const iot = getIotMeta(
    getIotStatusFromSpaceState(activeSpaceState) ??
      (active ? iotBySpace.get(active.spaceId)?.healthStatus : undefined),
  );
  const queueRows = active ? buildQueueRows(active, topTracks) : [];
  const currentQueue =
    queueRows.find(
      (queue) => queue.queueItemId === activeSpaceState?.currentQueueItemId,
    ) ??
    queueRows.find((queue) => queue.queueStatus === 1) ??
    queueRows[0];
  const displayArtist = active
    ? (topTracks.find((track) => track.trackId === active.trackId)?.artist ??
      active.artist ??
      'Unknown artist')
    : 'Unknown artist';
  const playing = Boolean(
    active &&
    (activeSpaceState?.currentQueueItemId ?? active.trackId) &&
    !active.isPaused,
  );

  useEffect(() => {
    if (!playing || audioAnalysis.beatId <= 0) return undefined;

    const coverArt = coverArtRef.current;
    if (!coverArt) return undefined;

    coverArt.classList.remove('beat-bump');
    void coverArt.offsetWidth;
    coverArt.classList.add('beat-bump');

    const timer = window.setTimeout(() => {
      coverArt.classList.remove('beat-bump');
    }, 270);

    return () => window.clearTimeout(timer);
  }, [audioAnalysis.beatId, playing]);

  const isCommanding = playbackControl.isPending || updateAudio.isPending;
  const hlsUrl = activeSpaceState?.hlsUrl ?? currentQueue?.hlsUrl ?? null;
  const fallbackElapsed = active
    ? getPlaybackElapsedSeconds(active, nowMs, activeSpaceState)
    : 0;
  const fallbackDuration = active ? getPlaybackDurationSeconds(active) : 0;
  const playerClockFresh =
    playerTimeUpdatedAtMs > 0 && nowMs - playerTimeUpdatedAtMs < 2500;
  const playerElapsed =
    playerClockFresh && !active?.isPaused
      ? playerCurrentTime + Math.max(0, (nowMs - playerTimeUpdatedAtMs) / 1000)
      : playerCurrentTime;
  const effectiveElapsed =
    playerClockFresh && playerDuration > 0 ? playerElapsed : fallbackElapsed;
  const effectiveDuration =
    playerDuration > 0 ? playerDuration : fallbackDuration;
  const progressPercent = active
    ? effectiveDuration > 0
      ? Math.max(0, Math.min(100, (effectiveElapsed / effectiveDuration) * 100))
      : getProgress(active, nowMs, activeSpaceState)
    : 0;

  const sendPlaybackCommand = (
    command: PlaybackCommand,
    extra?: {
      seekPositionSeconds?: number | null;
      targetQueueItemId?: string | null;
    },
  ) => {
    if (!active) return;

    playbackControl.mutate({
      spaceId: active.spaceId,
      command,
      seekPositionSeconds: extra?.seekPositionSeconds,
      targetQueueItemId: extra?.targetQueueItemId,
    });
  };

  const handlePlayPause = () => {
    if (playing) {
      hiddenPlayerRef.current?.pauseFromUserGesture();
      sendPlaybackCommand(PlaybackCommand.Pause);
      return;
    }

    void hiddenPlayerRef.current?.playFromUserGesture().catch((err) => {
      console.warn(
        '[BrandDashboard] Failed to unlock playback from user gesture:',
        err,
      );
    });
    sendPlaybackCommand(PlaybackCommand.Resume);
  };
  useEffect(() => {
    const unlockPlaybackFromGesture = () => {
      if (!playing || !hlsUrl || musicModalOpen) return;

      message.destroy(PLAYBACK_UNLOCK_TOAST_KEY);
      void hiddenPlayerRef.current?.playFromUserGesture().catch((err) => {
        console.warn(
          '[BrandDashboard] Failed to unlock playback from dashboard gesture:',
          err,
        );
      });
    };

    onPlaybackUnlockReady?.(unlockPlaybackFromGesture);

    return () => {
      onPlaybackUnlockReady?.(null);
    };
  }, [hlsUrl, musicModalOpen, onPlaybackUnlockReady, playing]);

  useEffect(() => {
    if (!playing || !hlsUrl || musicModalOpen || hasDocumentUserActivation()) {
      if (!playing || !hlsUrl || musicModalOpen) {
        message.destroy(PLAYBACK_UNLOCK_TOAST_KEY);
      }
      return;
    }

    if (playbackUnlockToastShownRef.current) return;

    playbackUnlockToastShownRef.current = true;
    message.info({
      key: PLAYBACK_UNLOCK_TOAST_KEY,
      content:
        'Your browser is waiting for interaction. Click anywhere on the dashboard to enable live playback audio.',
      duration: 6,
    });
  }, [hlsUrl, musicModalOpen, playing]);

  useEffect(() => {
    return () => {
      if (playbackFocusTimerRef.current) {
        window.clearTimeout(playbackFocusTimerRef.current);
      }
      if (playbackFocusFrameRef.current) {
        window.cancelAnimationFrame(playbackFocusFrameRef.current);
      }
    };
  }, []);

  if (loading)
    return (
      <Panel
        title='Live Playback'
        viewPath='/brand/stores'
        minHeight={358}
        style={{ height: '100%' }}
      >
        <Skeleton
          active
          paragraph={{ rows: 8 }}
        />
      </Panel>
    );
  if (!active)
    return (
      <Panel
        title='Live Playback'
        viewPath='/brand/stores'
        minHeight={358}
        style={{ height: '100%' }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description='No spaces are playing'
        />
      </Panel>
    );

  const handleSkipPrevious = () =>
    sendPlaybackCommand(PlaybackCommand.SkipPrevious);
  const handleSkipNext = () => sendPlaybackCommand(PlaybackCommand.SkipNext);
  const handleSeek = (seconds: number) =>
    sendPlaybackCommand(PlaybackCommand.Seek, {
      seekPositionSeconds: Math.max(0, Math.floor(seconds)),
    });
  const handleRewind10 = () => handleSeek(Math.max(0, effectiveElapsed - 10));
  const handleForward10 = () =>
    handleSeek(
      Math.min(
        effectiveDuration || effectiveElapsed + 10,
        effectiveElapsed + 10,
      ),
    );
  const handleToggleMute = () =>
    updateAudio.mutate({
      spaceId: active.spaceId,
      data: { isMuted: !active.isMuted },
    });
  const handleVolumeChangeComplete = (volume: number) =>
    updateAudio.mutate({
      spaceId: active.spaceId,
      data: { volumePercent: Math.max(0, Math.min(100, Math.floor(volume))) },
    });
  const handleQueueEndBehaviorChange = (next: number) =>
    updateAudio.mutate({
      spaceId: active.spaceId,
      data: { queueEndBehavior: next as QueueEndBehavior },
    });
  const seekFromPointer = (clientX: number, element: HTMLDivElement) => {
    if (!effectiveDuration || isCommanding) return;
    const rect = element.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    handleSeek(ratio * effectiveDuration);
  };
  const handleSkipToQueueItem = (queueItemId?: string | null) => {
    if (!queueItemId || queueItemId === activeSpaceState?.currentQueueItemId)
      return;
    sendPlaybackCommand(PlaybackCommand.SkipToTrack, {
      targetQueueItemId: queueItemId,
    });
  };

  const clearPlaybackFocusMotion = () => {
    if (playbackFocusTimerRef.current) {
      window.clearTimeout(playbackFocusTimerRef.current);
      playbackFocusTimerRef.current = null;
    }
    if (playbackFocusFrameRef.current) {
      window.cancelAnimationFrame(playbackFocusFrameRef.current);
      playbackFocusFrameRef.current = null;
    }
  };

  const openPlaybackFocus = () => {
    clearPlaybackFocusMotion();
    setIsPlaybackExpanded(true);
    setPlaybackFocusPhase('entering');
    playbackFocusFrameRef.current = window.requestAnimationFrame(() => {
      setPlaybackFocusPhase('open');
      playbackFocusFrameRef.current = null;
    });
  };

  const closePlaybackFocus = () => {
    clearPlaybackFocusMotion();
    setPlaybackFocusPhase('closing');
    playbackFocusTimerRef.current = window.setTimeout(() => {
      setIsPlaybackExpanded(false);
      setPlaybackFocusPhase('idle');
      playbackFocusTimerRef.current = null;
    }, 280);
  };

  const togglePlaybackExpanded = () => {
    if (isPlaybackExpanded) {
      closePlaybackFocus();
      return;
    }

    openPlaybackFocus();
  };

  const isPlaybackFocusOpen = playbackFocusPhase === 'open';

  const playbackCardStyle: React.CSSProperties = isPlaybackExpanded
    ? {
        position: 'fixed',
        left: '50%',
        top: '50%',
        width: 'min(980px, calc(100vw - 48px))',
        maxHeight: 'calc(100vh - 48px)',
        transform: `translate(-50%, -50%) scale(${isPlaybackFocusOpen ? 1 : 0.94})`,
        opacity: isPlaybackFocusOpen ? 1 : 0,
        zIndex: 1002,
        border: `1px solid ${mood.color}88`,
        borderRadius: 12,
        padding: 22,
        background: `radial-gradient(circle at 30% 38%, ${mood.color}28, transparent 34%), linear-gradient(145deg, #101013 0%, #09090b 100%)`,
        boxShadow: `0 24px 80px rgba(0,0,0,.58), 0 0 42px ${mood.color}24, inset 0 1px 0 rgba(255,255,255,.06)`,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition:
          'transform 260ms cubic-bezier(.16,1,.3,1), opacity 220ms ease, width 260ms cubic-bezier(.16,1,.3,1), max-height 260ms cubic-bezier(.16,1,.3,1), padding 260ms cubic-bezier(.16,1,.3,1), border-radius 260ms cubic-bezier(.16,1,.3,1), box-shadow 260ms ease',
        willChange: 'transform, opacity',
      }
    : {
        position: 'relative',
        border: `1px solid ${mood.color}66`,
        borderRadius: 8,
        padding: 14,
        background: `radial-gradient(circle at 30% 38%, ${mood.color}24, transparent 34%), linear-gradient(145deg, #101013 0%, #09090b 100%)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.04), 0 0 24px ${mood.color}18`,
        overflow: 'hidden',
        transform: 'scale(1)',
        opacity: 1,
        transition:
          'transform 220ms cubic-bezier(.16,1,.3,1), opacity 180ms ease, padding 220ms cubic-bezier(.16,1,.3,1), border-radius 220ms cubic-bezier(.16,1,.3,1), box-shadow 220ms ease',
        willChange: 'transform',
      };

  return (
    <Panel
      title='Live Playback'
      viewPath='/brand/stores'
      minHeight={358}
      style={{ height: '100%' }}
    >
      <div>
        {!musicModalOpen && (
          <div
            style={{
              position: 'fixed',
              left: -10000,
              top: -10000,
              width: 1,
              height: 1,
              overflow: 'hidden',
              opacity: 0,
              pointerEvents: 'none',
            }}
            aria-hidden
          >
            <SpacePlayer
              ref={hiddenPlayerRef}
              spaceId={active.spaceId}
              hlsUrl={hlsUrl}
              state={activeSpaceState as SpaceStateResponse | null | undefined}
              isPlaying={playing}
              isLoading={isCommanding}
              onPlayPause={handlePlayPause}
              onSkipNext={handleSkipNext}
              onSkipPrevious={handleSkipPrevious}
              onSeek={handleSeek}
              onVolumeChangeComplete={handleVolumeChangeComplete}
              onToggleMute={handleToggleMute}
              onRewind10={handleRewind10}
              onForward10={handleForward10}
              onQueueEndBehaviorChange={handleQueueEndBehaviorChange}
              onTimeUpdate={(currentTime) => {
                setPlayerCurrentTime(currentTime);
                setPlayerTimeUpdatedAtMs(Date.now());
              }}
              onDurationChange={setPlayerDuration}
              onAudioAnalysis={handleAudioAnalysis}
            />
          </div>
        )}

        {isPlaybackExpanded ? (
          <button
            type='button'
            aria-label='Close expanded live playback'
            onClick={closePlaybackFocus}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1001,
              border: 0,
              padding: 0,
              cursor: 'zoom-out',
              background: isPlaybackFocusOpen
                ? 'rgba(4,4,6,.62)'
                : 'rgba(4,4,6,0)',
              backdropFilter: isPlaybackFocusOpen ? 'blur(14px)' : 'blur(0px)',
              transition: 'background 240ms ease, backdrop-filter 280ms ease',
            }}
          />
        ) : null}

        <div style={playbackCardStyle}>
          <WaveVisualizer
            color={mood.color}
            playing={playing}
            analysis={audioAnalysis}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, rgba(255,255,255,.035), transparent 32%, rgba(255,255,255,.025))',
              pointerEvents: 'none',
            }}
          />
          <button
            onClick={() => go(-1)}
            style={navButton('left')}
            aria-label='Previous space'
          >
            <LeftOutlined />
          </button>
          <button
            onClick={() => go(1)}
            style={navButton('right')}
            aria-label='Next space'
          >
            <RightOutlined />
          </button>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 8,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <Text
                  ellipsis
                  style={{
                    color: C.text,
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 950,
                  }}
                >
                  {active.spaceName} - {active.storeName}
                </Text>
                <Text style={{ color: C.subtle, fontSize: 11 }}>
                  {SPACE_TYPE_LABELS[active.spaceType] ?? 'Space'} ·{' '}
                  {active.storeAddress ?? 'No address'}
                </Text>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type='button'
                  onClick={togglePlaybackExpanded}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: `1px solid ${C.borderSoft}`,
                    background: 'rgba(0,0,0,.28)',
                    color: C.muted,
                    cursor: isPlaybackExpanded ? 'zoom-out' : 'zoom-in',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                  aria-label={
                    isPlaybackExpanded
                      ? 'Collapse live playback'
                      : 'Expand live playback'
                  }
                >
                  {isPlaybackExpanded ? (
                    <FullscreenExitOutlined />
                  ) : (
                    <FullscreenOutlined />
                  )}
                </button>
                <Tag
                  color={active.isPaused ? 'warning' : 'error'}
                  style={{ margin: 0, fontSize: 10, fontWeight: 800 }}
                >
                  {active.isPaused ? 'Paused' : 'Now Playing'}
                </Tag>
                <Tag
                  color={iot.tag}
                  style={{ margin: 0, fontSize: 10, fontWeight: 800 }}
                >
                  {iot.label}
                </Tag>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isPlaybackExpanded
                  ? 'minmax(260px, .95fr) minmax(260px, 1fr)'
                  : 'minmax(164px, .92fr) minmax(170px, 1fr)',
                gap: isPlaybackExpanded ? 28 : 16,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  minHeight: isPlaybackExpanded ? 250 : 150,
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  ref={coverArtRef}
                  className='brand-live-cover'
                  style={
                    {
                      '--cover-beat-lift': `${-2 - audioAnalysis.beatStrength * 3}px`,
                      '--cover-beat-scale': `${1.14 + audioAnalysis.beatStrength * 0.12}`,
                      position: 'relative',
                      zIndex: 2,
                      width: isPlaybackExpanded ? 210 : 128,
                      height: isPlaybackExpanded ? 210 : 128,
                      borderRadius: '50%',
                      background: currentQueue?.coverImageUrl
                        ? `center / cover no-repeat url(${currentQueue.coverImageUrl})`
                        : `radial-gradient(circle at 38% 30%, ${mood.color}66 0%, rgba(15,23,42,.96) 100%)`,
                      border: `1px solid ${mood.color}77`,
                      boxShadow: playing
                        ? `0 0 0 ${7 + audioAnalysis.bass * 8 + audioAnalysis.treble * 5}px ${mood.color}2f, 0 0 ${34 + audioAnalysis.energy * 52 + audioAnalysis.bass * 24 + audioAnalysis.beatStrength * 24}px ${mood.color}88, inset 0 0 ${26 + audioAnalysis.treble * 18}px rgba(255,255,255,.08), inset 0 0 34px rgba(0,0,0,.54)`
                        : `0 0 18px ${mood.color}2f`,
                      transform: `scale(${
                        playing
                          ? 1 +
                            audioAnalysis.energy * 0.07 +
                            audioAnalysis.bass * 0.055 +
                            audioAnalysis.treble * 0.025 +
                            audioAnalysis.beatStrength * 0.025
                          : 1
                      })`,
                      filter: playing
                        ? `saturate(${1 + audioAnalysis.treble * 0.42}) brightness(${1 + audioAnalysis.energy * 0.12})`
                        : undefined,
                      transition:
                        'transform 90ms linear, box-shadow 90ms linear, filter 90ms linear',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    } as React.CSSProperties & {
                      '--cover-beat-lift': string;
                      '--cover-beat-scale': string;
                    }
                  }
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 12,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,.12)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#08080a',
                      border: '1px solid rgba(255,255,255,.18)',
                    }}
                  />
                  {!currentQueue?.coverImageUrl ? (
                    <SoundOutlined
                      style={{ color: mood.color, fontSize: 42 }}
                    />
                  ) : null}
                </div>
              </div>

              <div style={{ minWidth: 0 }}>
                <Text
                  ellipsis
                  style={{
                    color: C.text,
                    display: 'block',
                    fontSize: isPlaybackExpanded ? 30 : 19,
                    fontWeight: 950,
                  }}
                >
                  {active.trackName || 'No track playing'}
                </Text>
                <Text
                  ellipsis
                  style={{
                    color: C.muted,
                    display: 'block',
                    fontSize: isPlaybackExpanded ? 15 : 12,
                    marginTop: 2,
                  }}
                >
                  {displayArtist}
                </Text>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    marginTop: 10,
                  }}
                >
                  <Tag
                    style={{
                      margin: 0,
                      color: mood.color,
                      borderColor: `${mood.color}77`,
                      background: mood.bg,
                      fontWeight: 900,
                    }}
                  >
                    {active.moodName || mood.label}
                  </Tag>
                  {active.isManualOverride ? (
                    <Tag
                      color='processing'
                      style={{ margin: 0, fontSize: 10 }}
                    >
                      Manual
                    </Tag>
                  ) : null}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 8, padding: '0 42px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '34px minmax(0, 1fr) 34px',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: C.subtle, fontSize: 10 }}>
                  {formatDuration(effectiveElapsed)}
                </Text>
                <div
                  role='slider'
                  tabIndex={0}
                  aria-label='Seek playback position'
                  aria-valuemin={0}
                  aria-valuemax={Math.round(effectiveDuration)}
                  aria-valuenow={Math.round(effectiveElapsed)}
                  onPointerDown={(event) =>
                    seekFromPointer(event.clientX, event.currentTarget)
                  }
                  onKeyDown={(event) => {
                    if (!effectiveDuration) return;
                    if (event.key === 'ArrowLeft') {
                      event.preventDefault();
                      handleSeek(Math.max(0, effectiveElapsed - 5));
                    }
                    if (event.key === 'ArrowRight') {
                      event.preventDefault();
                      handleSeek(
                        Math.min(effectiveDuration, effectiveElapsed + 5),
                      );
                    }
                  }}
                  style={{
                    position: 'relative',
                    height: 18,
                    cursor: effectiveDuration ? 'pointer' : 'default',
                    outline: 'none',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 8,
                      height: 3,
                      borderRadius: 99,
                      background: 'rgba(255,255,255,.14)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 8,
                      height: 3,
                      width: `${progressPercent}%`,
                      borderRadius: 99,
                      background: C.red,
                      boxShadow: `0 0 12px ${C.red}88`,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: `${progressPercent}%`,
                      top: 5,
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: C.red,
                      boxShadow: `0 0 0 3px ${C.red}22`,
                      transform: 'translateX(-50%)',
                      opacity: effectiveDuration ? 1 : 0,
                    }}
                  />
                </div>
                <Text
                  style={{ color: C.subtle, fontSize: 10, textAlign: 'right' }}
                >
                  {formatDuration(effectiveDuration)}
                </Text>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center',
                  marginTop: 7,
                }}
              >
                <button
                  onClick={handleToggleMute}
                  disabled={updateAudio.isPending}
                  style={bareIconButton(active.isMuted ? C.red : C.muted)}
                  aria-label={active.isMuted ? 'Unmute' : 'Mute'}
                >
                  {active.isMuted ? <MutedOutlined /> : <SoundOutlined />}
                </button>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 24,
                  }}
                >
                  <button
                    onClick={handleSkipPrevious}
                    disabled={isCommanding}
                    style={transportButton(false)}
                    aria-label='Previous track'
                  >
                    <StepBackwardOutlined />
                  </button>
                  <button
                    onClick={handlePlayPause}
                    disabled={isCommanding || !hlsUrl}
                    style={transportButton(true, playing)}
                    aria-label={playing ? 'Pause' : 'Play'}
                  >
                    {playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  </button>
                  <button
                    onClick={handleSkipNext}
                    disabled={isCommanding}
                    style={transportButton(false)}
                    aria-label='Next track'
                  >
                    <StepForwardOutlined />
                  </button>
                </div>
                <button
                  onClick={() => setMusicModalOpen(true)}
                  style={{ ...bareIconButton(C.muted), justifySelf: 'end' }}
                  aria-label='Manage music'
                >
                  <UnorderedListOutlined />
                </button>
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                border: `1px solid ${C.borderSoft}`,
                borderRadius: 7,
                background: 'rgba(0,0,0,.2)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  alignItems: 'center',
                  padding: '7px 9px',
                  borderBottom: `1px solid ${C.borderSoft}`,
                }}
              >
                <Text style={{ color: C.muted, fontSize: 10, fontWeight: 950 }}>
                  Space Queue
                </Text>
                <Text style={{ color: C.subtle, fontSize: 10 }}>
                  {queueRows.length} track(s)
                </Text>
              </div>
              <div
                style={{
                  display: 'grid',
                  gap: 0,
                  maxHeight: isPlaybackExpanded ? 232 : 168,
                  overflowY: 'auto',
                }}
              >
                {queueRows.map((queue, index) => {
                  const status = resolveQueueStatus(
                    queue,
                    activeSpaceState?.currentQueueItemId,
                    index,
                    queueRows,
                  );
                  const statusTone = getCamsQueueStatusTone(status);
                  const current = status === QueueItemStatus.Playing;
                  const playable =
                    canPlayCamsQueueItem(status) && !!queue.queueItemId;
                  const queueArtist =
                    queue.artist ||
                    topTracks.find((track) => track.trackId === queue.trackId)
                      ?.artist ||
                    '--';
                  return (
                    <button
                      key={queue.queueItemId ?? `${active.spaceId}-${index}`}
                      onDoubleClick={() =>
                        playable && handleSkipToQueueItem(queue.queueItemId)
                      }
                      disabled={!playable || playbackControl.isPending}
                      title={
                        playable
                          ? 'Double click to play this item'
                          : `${getCamsQueueStatusLabel(status)} item`
                      }
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          '74px minmax(0, 1fr) minmax(58px, .45fr)',
                        gap: 8,
                        alignItems: 'center',
                        textAlign: 'left',
                        padding: '7px 9px',
                        border: 0,
                        borderBottom: `1px solid ${C.borderSoft}`,
                        background: current ? `${C.red}1c` : statusTone.bg,
                        cursor: playable ? 'pointer' : 'default',
                        opacity:
                          status === QueueItemStatus.Played ||
                          status === QueueItemStatus.Skipped
                            ? 0.68
                            : 1,
                      }}
                    >
                      <Text
                        style={{
                          color: statusTone.color,
                          fontSize: 10,
                          fontWeight: 950,
                        }}
                      >
                        {getCamsQueueStatusLabel(status)}
                      </Text>
                      <Text
                        ellipsis
                        style={{
                          color: current ? '#fff' : C.text,
                          fontSize: 11,
                          fontWeight: current ? 900 : 700,
                        }}
                      >
                        {queue.trackName || 'Unknown track'}
                      </Text>
                      <Text
                        ellipsis
                        style={{
                          color: C.subtle,
                          fontSize: 10,
                          textAlign: 'right',
                        }}
                      >
                        {queueArtist}
                      </Text>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 5,
            marginTop: 9,
          }}
        >
          {items.map((space, index) => (
            <button
              key={space.spaceId}
              onClick={() => onActiveIndexChange(index)}
              style={{
                width: index === activeIndex ? 18 : 6,
                height: 6,
                border: 0,
                borderRadius: 99,
                background:
                  index === activeIndex ? C.red : 'rgba(255,255,255,.2)',
                cursor: 'pointer',
              }}
            />
          ))}
          <Text style={{ color: C.subtle, fontSize: 10, marginLeft: 5 }}>
            {activeIndex + 1} / {items.length}
          </Text>
        </div>
        {musicModalOpen ? (
          <SpaceMusicModal
            open={musicModalOpen}
            spaceId={active.spaceId}
            storeId={active.storeId}
            zIndex={isPlaybackExpanded ? 1200 : undefined}
            onClose={() => setMusicModalOpen(false)}
          />
        ) : null}
      </div>
    </Panel>
  );
};

const transportButton = (
  primary = false,
  active = false,
): React.CSSProperties => ({
  width: primary ? 42 : 32,
  height: primary ? 42 : 32,
  borderRadius: '50%',
  border: `1px solid ${primary ? 'transparent' : 'rgba(255,255,255,.08)'}`,
  background: primary ? (active ? C.red : C.blue) : 'rgba(255,255,255,.025)',
  color: primary ? '#fff' : C.muted,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: primary ? 22 : 14,
  boxShadow: primary ? `0 8px 22px ${C.red}3f` : 'none',
  padding: 0,
});

const bareIconButton = (color: string): React.CSSProperties => ({
  width: 32,
  height: 32,
  border: 0,
  background: 'transparent',
  color,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: 16,
  padding: 0,
});

const navButton = (side: 'left' | 'right'): React.CSSProperties => ({
  position: 'absolute',
  [side]: 10,
  top: '43%',
  zIndex: 3,
  width: 30,
  height: 30,
  borderRadius: '50%',
  border: `1px solid ${C.borderSoft}`,
  background: 'rgba(0,0,0,.45)',
  color: C.text,
  cursor: 'pointer',
});
const StoreHealth = ({
  data,
  loading,
}: {
  data: ReturnType<typeof useBrandDashboard>['data'];
  loading?: boolean;
}) => {
  const rows = data?.storeHealth ?? [];
  const healthy = rows.filter(
    (row) => row.healthStatus === BrandStoreHealthStatusEnum.Healthy,
  ).length;
  const warning = rows.filter(
    (row) => row.healthStatus === BrandStoreHealthStatusEnum.Attention,
  ).length;
  return (
    <Panel
      title='Store Health'
      viewPath='/brand/stores'
      minHeight={292}
      style={{ height: '100%' }}
    >
      {loading ? (
        <Skeleton
          active
          paragraph={{ rows: 6 }}
        />
      ) : rows.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              gap: 18,
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <Progress
              type='circle'
              percent={
                data?.overview.totalStores
                  ? Math.round((healthy / data.overview.totalStores) * 100)
                  : 0
              }
              size={94}
              strokeColor={C.green}
              railColor='rgba(255,255,255,.08)'
              format={() => (
                <div>
                  <div style={{ color: C.text, fontSize: 22, fontWeight: 900 }}>
                    {formatNumber(data?.overview.totalStores)}
                  </div>
                  <div style={{ color: C.subtle, fontSize: 9 }}>
                    Total Stores
                  </div>
                </div>
              )}
            />
            <div style={{ flex: 1, display: 'grid', gap: 7 }}>
              {[
                { label: 'Healthy', value: healthy, color: C.green },
                { label: 'Warning', value: warning, color: C.orange },
                {
                  label: 'Inactive',
                  value: data?.overview.inactiveStores ?? 0,
                  color: C.subtle,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 99,
                      background: item.color,
                    }}
                  />
                  <Text style={{ color: C.muted, flex: 1, fontSize: 12 }}>
                    {item.label}
                  </Text>
                  <Text
                    style={{ color: C.text, fontSize: 12, fontWeight: 800 }}
                  >
                    {item.value}
                  </Text>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {rows.slice(0, 6).map((row) => (
              <div
                key={row.storeId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <Text
                  ellipsis
                  style={{ color: C.muted, fontSize: 12 }}
                >
                  {row.storeName}
                </Text>
                <Tag
                  color={
                    row.healthStatus === BrandStoreHealthStatusEnum.Healthy
                      ? 'success'
                      : row.healthStatus ===
                          BrandStoreHealthStatusEnum.Attention
                        ? 'warning'
                        : 'default'
                  }
                  style={{ margin: 0, fontSize: 10 }}
                >
                  {row.healthStatus === BrandStoreHealthStatusEnum.Healthy
                    ? 'Healthy'
                    : row.healthStatus === BrandStoreHealthStatusEnum.Attention
                      ? 'Warning'
                      : 'Inactive'}
                </Tag>
                <Text style={{ color: C.green, fontSize: 12, fontWeight: 800 }}>
                  {row.playingSpaces}/{row.activeSpaces}
                </Text>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
};

const IotHealth = ({
  rows,
  loading,
}: {
  rows: BrandDashboardIotSpaceHealthItem[];
  loading?: boolean;
}) => (
  <Panel
    title='IoT Space Health'
    viewPath='/brand/stores'
    minHeight={292}
    style={{ height: '100%' }}
  >
    {loading ? (
      <Skeleton
        active
        paragraph={{ rows: 7 }}
      />
    ) : rows.length === 0 ? (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
    ) : (
      <div style={{ display: 'grid', gap: 8 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr auto auto',
            gap: 8,
            color: C.subtle,
            fontSize: 10,
            fontWeight: 800,
          }}
        >
          <span>Space</span>
          <span>Store</span>
          <span>Status</span>
          <span>Last seen</span>
        </div>
        {rows.slice(0, 7).map((row) => {
          const meta = getIotMeta(row.healthStatus);
          return (
            <div
              key={row.spaceId}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr auto auto',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <Text
                ellipsis
                style={{ color: C.text, fontSize: 12 }}
              >
                {row.spaceName}
              </Text>
              <Text
                ellipsis
                style={{ color: C.muted, fontSize: 12 }}
              >
                {row.storeName}
              </Text>
              <Tag
                color={meta.tag}
                style={{ margin: 0, fontSize: 10 }}
              >
                {meta.label}
              </Tag>
              <Text style={{ color: C.subtle, fontSize: 11 }}>
                {formatAgo(row.lastTelemetryAtUtc)}
              </Text>
            </div>
          );
        })}
      </div>
    )}
  </Panel>
);

const TopTracks = ({
  tracks,
  loading,
}: {
  tracks: BrandDashboardTopTrackItem[];
  loading?: boolean;
}) => (
  <Panel
    title='Top Tracks'
    viewPath='/brand/tracks'
    minHeight={258}
  >
    {loading ? (
      <Skeleton
        active
        paragraph={{ rows: 5 }}
      />
    ) : tracks.length === 0 ? (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
    ) : (
      <div style={{ display: 'grid', gap: 8 }}>
        {tracks.slice(0, 5).map((track, index) => (
          <div
            key={track.trackId ?? `${track.trackName}-${index}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '22px 1fr auto auto',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: C.subtle, fontSize: 11 }}>{index + 1}</Text>
            <div style={{ minWidth: 0 }}>
              <Text
                ellipsis
                style={{ color: C.text, display: 'block', fontSize: 12 }}
              >
                {track.trackName}
              </Text>
              <Text
                ellipsis
                style={{ color: C.subtle, display: 'block', fontSize: 10 }}
              >
                {track.artist || 'Unknown artist'}
              </Text>
            </div>
            <Tag
              color={
                track.scope === TrackScopeEnum.BrandOwned
                  ? 'green'
                  : track.scope === TrackScopeEnum.Global
                    ? 'blue'
                    : 'default'
              }
              style={{ margin: 0, fontSize: 10 }}
            >
              {track.scope === TrackScopeEnum.BrandOwned
                ? 'Brand-owned'
                : track.scope === TrackScopeEnum.Global
                  ? 'Global'
                  : 'Unknown'}
            </Tag>
            <Text style={{ color: C.green, fontSize: 12, fontWeight: 900 }}>
              {formatNumber(track.plays)}
            </Text>
          </div>
        ))}
      </div>
    )}
  </Panel>
);

const Spark = ({ color, seed }: { color: string; seed: number }) => (
  <svg
    viewBox='0 0 110 58'
    style={{ width: '100%', maxWidth: 132 }}
  >
    <polyline
      fill='none'
      stroke={color}
      strokeWidth='2.4'
      points={Array.from(
        { length: 14 },
        (_, i) =>
          `${i * 8},${48 - (Math.sin(i * 0.9 + seed) * 14 + Math.cos(i * 0.45 + seed) * 8 + 18)}`,
      ).join(' ')}
    />
  </svg>
);

const ContextBillingAi = ({
  data,
  loading,
}: {
  data: ReturnType<typeof useBrandDashboard>['data'];
  loading?: boolean;
}) => (
  <Row gutter={[10, 10]}>
    <Col
      xs={24}
      lg={12}
    >
      <Panel
        title='Context Intelligence'
        viewPath='/brand/stores'
        minHeight={258}
      >
        {loading ? (
          <Skeleton
            active
            paragraph={{ rows: 5 }}
          />
        ) : (
          <Row gutter={[8, 8]}>
            {[
              {
                label: 'People',
                value: formatNumber(data?.contextIntelligence.avgPeopleCount),
                color: C.blue,
                seed: 1,
              },
              {
                label: 'Noise',
                value: `${Math.round(data?.contextIntelligence.avgNoiseDecibel ?? 0)} dB`,
                color: C.green,
                seed: 2,
              },
              {
                label: 'Confidence',
                value: `${Math.round((data?.contextIntelligence.avgFuzzyConfidence ?? 0) * 100)}%`,
                color: C.orange,
                seed: 3,
              },
            ].map((item) => (
              <Col
                xs={24}
                md={8}
                key={item.label}
              >
                <div
                  style={{
                    background: 'rgba(255,255,255,.035)',
                    border: `1px solid ${C.borderSoft}`,
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <Text
                    style={{ color: C.subtle, fontSize: 10, fontWeight: 800 }}
                  >
                    {item.label}
                  </Text>
                  <div style={{ color: C.text, fontSize: 20, fontWeight: 900 }}>
                    {item.value}
                  </div>
                  <Spark
                    color={item.color}
                    seed={item.seed}
                  />
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Panel>
    </Col>
    <Col
      xs={24}
      lg={6}
    >
      <Panel
        title='Billing'
        viewPath='/brand/tokens'
        minHeight={258}
      >
        {loading ? (
          <Skeleton
            active
            paragraph={{ rows: 5 }}
          />
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            <Text style={{ color: C.subtle, fontSize: 11 }}>Wallet</Text>
            <div style={{ color: C.text, fontSize: 26, fontWeight: 900 }}>
              {formatCompact(data?.billing.balanceTokens)}
            </div>
            <Progress
              percent={Math.min(
                100,
                ((data?.billing.rangeUsageTokens ?? 0) /
                  Math.max(data?.billing.balanceTokens ?? 1, 1)) *
                  100,
              )}
              showInfo={false}
              strokeColor={C.blue}
              railColor='rgba(255,255,255,.1)'
            />
            <Text style={{ color: C.subtle, fontSize: 11 }}>
              {data?.billing.lockStatus === WalletLockStatusEnum.None
                ? 'Active wallet'
                : 'Wallet locked'}
            </Text>
            <TrendLine
              text={`${formatCompact(data?.billing.rangeUsageTokens)} used this period, ${
                formatTokenUsageTrendText(data?.billing.rangeUsageTrend) ??
                '0 used vs previous period'
              }`}
              tone={getUsageTrendTone(data?.billing.rangeUsageTrend?.delta)}
              direction={getTrendDirection(
                data?.billing.rangeUsageTrend?.delta,
              )}
            />
          </div>
        )}
      </Panel>
    </Col>
    <Col
      xs={24}
      lg={6}
    >
      <Panel
        title='AI Generation'
        viewPath='/brand/suno-ai'
        minHeight={258}
      >
        {loading ? (
          <Skeleton
            active
            paragraph={{ rows: 5 }}
          />
        ) : (
          <div style={{ display: 'grid', gap: 9 }}>
            <div style={{ color: C.text, fontSize: 28, fontWeight: 900 }}>
              {formatNumber(data?.aiGeneration.totalInRange)}
            </div>
            <Progress
              percent={
                data?.aiGeneration.totalInRange
                  ? Math.round(
                      (data.aiGeneration.completed /
                        data.aiGeneration.totalInRange) *
                        100,
                    )
                  : 0
              }
              showInfo={false}
              strokeColor={C.green}
              railColor='rgba(255,255,255,.1)'
            />
            {[
              ['Queued', data?.aiGeneration.queued],
              ['Processing', data?.aiGeneration.processing],
              ['Completed', data?.aiGeneration.completed],
              ['Failed', data?.aiGeneration.failed],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <Text style={{ color: C.muted, fontSize: 12 }}>{label}</Text>
                <Text style={{ color: C.text, fontSize: 12, fontWeight: 900 }}>
                  {value ?? 0}
                </Text>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </Col>
  </Row>
);

export const BrandDashboard = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState(BrandDashboardPeriodEnum.Day);
  const [activePlaybackIndex, setActivePlaybackIndex] = useState(0);
  const filter = useMemo(() => ({ period, top: 10 }), [period]);
  const { data, isLoading, isFetching, refetch } = useBrandDashboard(filter);
  const playbackItems = data?.livePlayback.items ?? EMPTY_LIVE_PLAYBACK_ITEMS;
  const resolvedActivePlaybackIndex =
    playbackItems.length === 0
      ? 0
      : Math.min(activePlaybackIndex, playbackItems.length - 1);
  const activePlaybackItem = playbackItems[resolvedActivePlaybackIndex];
  const activePlaybackSpaceId = activePlaybackItem?.spaceId;
  const activePlaybackStoreId = activePlaybackItem?.storeId;
  const realtimeBrandId = data?.brandId;
  const { isConnected } = useBrandDashboardRealtime({
    brandId: realtimeBrandId,
    filter,
    activeSpaceId: activePlaybackSpaceId,
    activeStoreId: activePlaybackStoreId,
  });
  const overview = data?.overview;
  const iotRows = data?.iotSpaceHealth ?? EMPTY_IOT_SPACE_HEALTH_ITEMS;
  const iotBySpace = useMemo(
    () => new Map(iotRows.map((row) => [row.spaceId, row])),
    [iotRows],
  );
  const dashboardPlaybackUnlockRef = useRef<(() => void) | null>(null);
  const handlePlaybackUnlockReady = useCallback(
    (handler: (() => void) | null) => {
      dashboardPlaybackUnlockRef.current = handler;
    },
    [],
  );
  const handleDashboardUserGesture = useCallback(() => {
    dashboardPlaybackUnlockRef.current?.();
  }, []);
  const comparisonLabel = getComparisonLabel(data?.period ?? period);
  const playingShare =
    overview?.activeSpaces && overview.activeSpaces > 0
      ? Math.round(
          ((overview.spacesCurrentlyPlaying ?? 0) / overview.activeSpaces) *
            100,
        )
      : 0;
  const iotOnlineShare =
    overview?.totalSpaces && overview.totalSpaces > 0
      ? Math.round(
          ((overview.iotOnlineSpaces ?? 0) / overview.totalSpaces) * 100,
        )
      : 0;

  useEffect(() => {
    document.addEventListener('pointerdown', handleDashboardUserGesture, true);

    return () => {
      document.removeEventListener(
        'pointerdown',
        handleDashboardUserGesture,
        true,
      );
    };
  }, [handleDashboardUserGesture]);

  return (
    <div style={{ paddingBottom: 34 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 14,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Text style={{ color: C.subtle, fontSize: 12, fontWeight: 800 }}>
            Brand Manager
          </Text>
          <Title
            level={3}
            style={{ margin: '2px 0 0', color: C.text }}
          >
            {data?.brandName
              ? `${data.brandName} Dashboard`
              : 'Brand Dashboard'}
          </Title>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <Segmented
            size='small'
            value={period}
            onChange={(value) => setPeriod(value as BrandDashboardPeriodEnum)}
            options={[
              { label: 'Today', value: 1 },
              { label: 'Week', value: 2 },
              { label: 'Month', value: 3 },
              { label: 'Year', value: 4 },
            ]}
          />
          <Tag
            color={isConnected ? 'success' : 'default'}
            style={{ margin: 0, fontWeight: 800 }}
          >
            {isConnected ? 'Realtime' : 'Snapshot'}
          </Tag>
          <button
            onClick={() => refetch()}
            style={{
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.muted,
              borderRadius: 6,
              padding: '4px 9px',
              cursor: 'pointer',
            }}
          >
            {isFetching
              ? 'Updating...'
              : `Updated ${formatAgo(data?.generatedAtUtc)}`}
          </button>
        </div>
      </div>

      <Row
        gutter={[10, 10]}
        style={{ marginBottom: 10 }}
      >
        <Col
          xs={24}
          sm={12}
          lg={5}
        >
          <KpiCard
            icon={<CustomerServiceOutlined />}
            label='Total Stores'
            value={formatNumber(overview?.totalStores)}
            detail={`${formatNumber(overview?.activeStores)} active`}
            trendText={formatTrendText(
              overview?.totalStoresTrend,
              comparisonLabel,
              'delta',
              'new',
            )}
            trendTone={getTrendTone(overview?.totalStoresTrend?.delta)}
            trendDirection={getTrendDirection(
              overview?.totalStoresTrend?.delta,
            )}
            loading={isLoading}
            onClick={() => navigate('/brand/stores')}
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={5}
        >
          <KpiCard
            icon={<AudioOutlined />}
            label='Spaces Playing'
            value={formatNumber(overview?.spacesCurrentlyPlaying)}
            detail={`${formatNumber(overview?.activeSpaces)} active spaces`}
            trendText={`${playingShare}% of active spaces`}
            trendTone={playingShare > 0 ? C.green : C.subtle}
            trendDirection='flat'
            accent={C.blue}
            loading={isLoading}
            onClick={() => navigate('/brand/stores')}
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={5}
        >
          <KpiCard
            icon={<UnorderedListOutlined />}
            label='Total Plays'
            value={formatNumber(overview?.totalPlays)}
            detail={`${formatNumber(overview?.distinctTracksPlayed)} tracks`}
            trendText={formatPlayTrendText(
              overview?.totalPlaysTrend,
              comparisonLabel,
            )}
            trendTone={getTrendTone(overview?.totalPlaysTrend?.delta)}
            trendDirection={getTrendDirection(overview?.totalPlaysTrend?.delta)}
            loading={isLoading}
            onClick={() => navigate('/brand/tracks')}
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={5}
        >
          <IotKpiCard
            totalSpaces={overview?.totalSpaces}
            online={overview?.iotOnlineSpaces}
            offline={overview?.iotOfflineSpaces}
            stale={overview?.iotStaleSpaces}
            unknown={overview?.iotUnknownSpaces}
            trendText={`${iotOnlineShare}% online`}
            trendTone={iotOnlineShare > 0 ? C.green : C.subtle}
            trendDirection='flat'
            loading={isLoading}
            onClick={() => navigate('/brand/stores')}
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={4}
        >
          <KpiCard
            icon={<WalletOutlined />}
            label='Token Balance'
            value={formatCompact(data?.billing.balanceTokens)}
            detail={`${formatCompact(data?.billing.rangeUsageTokens)} used`}
            trendText={formatTokenUsageTrendText(
              data?.billing.rangeUsageTrend,
              comparisonLabel,
            )}
            trendTone={getUsageTrendTone(data?.billing.rangeUsageTrend?.delta)}
            trendDirection={getTrendDirection(
              data?.billing.rangeUsageTrend?.delta,
            )}
            accent={C.blue}
            loading={isLoading}
            onClick={() => navigate('/brand/tokens')}
          />
        </Col>
      </Row>

      <Row
        gutter={[10, 10]}
        style={{ marginBottom: 10 }}
        align='stretch'
      >
        <Col
          xs={24}
          xl={7}
          style={{ display: 'flex' }}
        >
          <StoreHealth
            data={data}
            loading={isLoading}
          />
        </Col>
        <Col
          xs={24}
          xl={8}
          style={{ display: 'flex' }}
        >
          <IotHealth
            rows={iotRows}
            loading={isLoading}
          />
        </Col>
        <Col
          xs={24}
          xl={9}
          style={{ display: 'flex' }}
        >
          <LivePlayback
            items={playbackItems}
            iotBySpace={iotBySpace}
            topTracks={data?.topTracks ?? []}
            loading={isLoading}
            activeIndex={resolvedActivePlaybackIndex}
            onActiveIndexChange={setActivePlaybackIndex}
            onPlaybackUnlockReady={handlePlaybackUnlockReady}
          />
        </Col>
      </Row>

      <Row
        gutter={[10, 10]}
        style={{ marginBottom: 10 }}
      >
        <Col
          xs={24}
          xl={7}
        >
          <TopTracks
            tracks={data?.topTracks ?? []}
            loading={isLoading}
          />
        </Col>
        <Col
          xs={24}
          xl={17}
        >
          <ContextBillingAi
            data={data}
            loading={isLoading}
          />
        </Col>
      </Row>

      <div style={{ ...panel(), padding: 12 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(132px, 1fr))',
            gap: 8,
          }}
        >
          {[
            ['Stores', <CustomerServiceOutlined />, '/brand/stores', C.red],
            [
              'Playlists',
              <UnorderedListOutlined />,
              '/brand/playlists',
              C.blue,
            ],
            ['Schedules', <CalendarOutlined />, '/brand/schedule', C.orange],
            ['AI Music', <ThunderboltOutlined />, '/brand/suno-ai', C.red],
            ['Billing', <WalletOutlined />, '/brand/tokens', C.green],
          ].map(([label, icon, to, color]) => (
            <button
              key={label as string}
              onClick={() => navigate(to as string)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: `1px solid ${C.borderSoft}`,
                background: 'rgba(255,255,255,.035)',
                color: C.text,
                borderRadius: 8,
                padding: '10px 12px',
                cursor: 'pointer',
                fontWeight: 800,
              }}
            >
              <span style={{ color: color as string }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 12,
          color: C.subtle,
          fontSize: 11,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span>
          <Badge status='success' /> All systems operational
        </span>
        <span>
          Mood Guide: <span style={{ color: C.chill }}>Chill</span> -{' '}
          <span style={{ color: C.blue }}>Focus</span> -{' '}
          <span style={{ color: C.orange }}>Energetic</span>
        </span>
      </div>
    </div>
  );
};
