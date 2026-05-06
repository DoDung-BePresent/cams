import { useMemo, useState, useEffect } from 'react';
import type React from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Flex,
  Row,
  Segmented,
  Select,
  Skeleton,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  LockOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SoundOutlined,
  ThunderboltOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';

import { STALE_TIME } from '@/config';
import { useAuth } from '@/providers';
import { useStoreContext } from '@/features/store/hooks';
import { RoleEnum } from '@/shared/types';
import { spaceService } from '@/shared/modules/spaces/services';
import type { SpaceListItem } from '@/shared/modules/spaces/types';
import type { ColumnsType } from 'antd/es/table';
import type {
  StoreContextRawLogItem,
  StoreContextTimeSeriesPoint,
} from '@/features/brand/types';
import {
  buildLatestContextLogBySpace,
  getLatestContextLogForSpace,
  sumLivePeopleRows,
} from '@/features/brand/utils/livePeople';
import { billingService, storeService } from '@/features/brand/services';
import { camsService } from '@/shared/modules/cams/services';
import type { SpaceStateResponse } from '@/shared/modules/cams/types';
import { EntityStatusEnum } from '@/shared/types';
import { PageHeader } from '@/shared/components';

type PeriodOption = 'day' | 'week' | 'month' | 'custom';
type GranularityOption = 'hour' | 'day';
type DashboardMetricKey = 'noise' | 'crowdDensity';

type RangeValue = [dayjs.Dayjs, dayjs.Dayjs];

const LIVE_POLL_MS = 5000;
const LIVE_PAGE_SIZE = 300;

const dashboardCardStyle: React.CSSProperties = {
  background: 'rgba(24,24,27,0.88)',
  border: '1px solid rgba(80,45,50,0.75)',
  borderRadius: 14,
  boxShadow: '0 18px 42px rgba(0,0,0,0.18)',
};

const panelBodyStyle: React.CSSProperties = {
  background: 'transparent',
};

const kpiValueStyle: React.CSSProperties = {
  color: '#f8f7f7',
  fontWeight: 800,
  fontSize: 28,
  lineHeight: 1,
};

const StatTile = ({
  icon,
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'danger';
}) => {
  const toneMap = {
    neutral: {
      bg: 'rgba(255,255,255,0.05)',
      border: 'rgba(255,255,255,0.08)',
      color: '#cbd5e1',
    },
    good: {
      bg: 'rgba(34,197,94,0.10)',
      border: 'rgba(134,239,172,0.20)',
      color: '#86efac',
    },
    warn: {
      bg: 'rgba(251,191,36,0.10)',
      border: 'rgba(251,191,36,0.24)',
      color: '#fbbf24',
    },
    danger: {
      bg: 'rgba(239,68,68,0.12)',
      border: 'rgba(248,113,113,0.28)',
      color: '#fca5a5',
    },
  }[tone];

  return (
    <div
      style={{
        ...dashboardCardStyle,
        padding: 18,
        minHeight: 118,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Flex
        justify='space-between'
        align='center'
        gap={12}
      >
        <Typography.Text
          style={{
            color: '#b7adb0',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Typography.Text>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: toneMap.bg,
            border: `1px solid ${toneMap.border}`,
            color: toneMap.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </Flex>
      <div>
        <div style={kpiValueStyle}>{value}</div>
        {detail && (
          <Typography.Text style={{ color: '#857b80', fontSize: 12 }}>
            {detail}
          </Typography.Text>
        )}
      </div>
    </div>
  );
};

/** Map telemetry group key (id or name) to space GUID for CAMS state API */
const resolveSpaceIdForPlayback = (
  blockKey: string,
  blockTitle: string,
  spaceList: SpaceListItem[] | undefined,
): string | undefined => {
  if (!spaceList?.length) return undefined;
  if (spaceList.some((s) => s.id === blockKey)) return blockKey;
  const byTitle = spaceList.find((s) => s.name === blockTitle);
  if (byTitle) return byTitle.id;
  const byNameAsKey = spaceList.find((s) => s.name === blockKey);
  if (byNameAsKey) return byNameAsKey.id;
  return undefined;
};

type PlaybackPollSlot = {
  state: SpaceStateResponse | null;
  isPending: boolean;
  isFetching: boolean;
};

enum IotHealthStatusEnum {
  NoDevice = 1,
  Online = 2,
  Offline = 3,
  Stale = 4,
}

type StoreDashboardIotStatus = 'Online' | 'Offline' | 'Stale' | 'Not paired';

const getIotStatusFromSpaceState = (
  state: SpaceStateResponse | null | undefined,
): StoreDashboardIotStatus => {
  switch (state?.iotHealthStatus) {
    case IotHealthStatusEnum.NoDevice:
      return 'Not paired';
    case IotHealthStatusEnum.Online:
      return 'Online';
    case IotHealthStatusEnum.Offline:
      return 'Offline';
    case IotHealthStatusEnum.Stale:
    case 5:
      return 'Stale';
    default:
      if (state?.isIotDeviceAssigned === false) return 'Not paired';
      if (state?.isIotDeviceOffline === true) return 'Offline';
      if (state?.isIotDeviceOffline === false) return 'Online';
      return 'Stale';
  }
};

const renderIotStatusTag = (
  status: StoreDashboardIotStatus,
): React.ReactNode => {
  switch (status) {
    case 'Online':
      return <Tag color='success'>IoT Online</Tag>;
    case 'Offline':
      return <Tag color='error'>IoT Offline</Tag>;
    case 'Stale':
      return <Tag color='warning'>IoT Stale</Tag>;
    case 'Not paired':
      return <Tag color='warning'>IoT Unassigned</Tag>;
    default:
      return <Tag color='warning'>IoT Stale</Tag>;
  }
};

type SpaceHealthRow = {
  key: string;
  spaceName: string;
  peopleNow: number | null;
  noiseNow: number | null;
  moodName: string | null;
  currentTrack: string | null;
  playbackStatus: 'Playing' | 'Paused' | 'Idle' | 'Loading';
  iotStatus: StoreDashboardIotStatus;
  lastUpdatedUtc: string | null;
};

const NowPlayingBanner = ({
  spaceLabel,
  slot,
}: {
  spaceLabel: string;
  slot?: PlaybackPollSlot;
}) => {
  if (!slot) {
    return (
      <Typography.Paragraph
        type='secondary'
        style={{ marginBottom: 14 }}
      >
        Playback: could not resolve space id for &quot;{spaceLabel}&quot;.
      </Typography.Paragraph>
    );
  }

  if (slot.isPending) {
    return (
      <div style={{ marginBottom: 14 }}>
        <Typography.Text
          type='secondary'
          style={{ fontSize: 12 }}
        >
          {spaceLabel}
        </Typography.Text>
        <Skeleton
          active
          title={{ width: '55%' }}
          paragraph={{ rows: 1 }}
        />
      </div>
    );
  }

  const s = slot.state;
  const hasStream = Boolean(s?.hlsUrl);
  const trackTitle = s?.currentTrackName?.trim();
  const idle = !hasStream && !trackTitle;
  const iotStatusTag = renderIotStatusTag(getIotStatusFromSpaceState(s));

  if (idle) {
    return (
      <Flex
        align='center'
        gap={10}
        style={{
          marginBottom: 14,
          padding: '10px 12px',
          background: '#202024',
          borderRadius: 8,
          border: '1px dashed #404040',
        }}
      >
        <SoundOutlined style={{ fontSize: 20, color: '#8b8b92' }} />
        <div>
          <Typography.Text
            style={{ color: '#f8f7f7' }}
            strong
          >
            {spaceLabel}
          </Typography.Text>
          <div>
            <Typography.Text style={{ color: '#857b80' }}>
              No track playing
            </Typography.Text>
          </div>
          <Space
            size={[6, 6]}
            wrap
            style={{ marginTop: 6 }}
          >
            {iotStatusTag}
          </Space>
        </div>
      </Flex>
    );
  }

  return (
    <Flex
      align='flex-start'
      gap={12}
      wrap='wrap'
      style={{
        marginBottom: 14,
        padding: '12px 14px',
        borderRadius: 10,
        background:
          'linear-gradient(120deg, rgba(239,68,68,0.14) 0%, rgba(239,68,68,0.07) 60%, rgba(0,0,0,0) 100%)',
        border: slot.isFetching
          ? '1px solid rgba(239,68,68,0.5)'
          : '1px solid rgba(239,68,68,0.25)',
        boxShadow: slot.isFetching ? '0 0 0 2px rgba(239,68,68,0.1)' : 'none',
        transition: 'box-shadow 0.35s ease, border-color 0.35s ease',
      }}
    >
      <SoundOutlined
        className='store-now-playing-icon'
        style={{ fontSize: 26, color: '#f8f7f7', marginTop: 2 }}
      />
      <div style={{ flex: 1, minWidth: 200 }}>
        <Typography.Text style={{ fontSize: 11, color: '#857b80' }}>
          Now playing · {spaceLabel}
        </Typography.Text>
        <Typography.Title
          level={5}
          style={{ margin: '4px 0 6px', fontWeight: 700, color: '#f8f7f7' }}
        >
          {trackTitle || 'Playing (stream active)'}
        </Typography.Title>
        <Space
          size={[6, 6]}
          wrap
        >
          {s?.moodName && <Tag color='purple'>{s.moodName}</Tag>}
          {s?.isPaused ? (
            <Tag color='warning'>Paused</Tag>
          ) : (
            <Tag color='success'>Playing</Tag>
          )}
          {s?.isMuted && <Tag>Muted</Tag>}
          {s?.isManualOverride && <Tag color='magenta'>Manual override</Tag>}
          {iotStatusTag}
          {s?.fuzzyRule && (
            <Tooltip title={s.fuzzyReason || undefined}>
              <Tag>{s.fuzzyRule}</Tag>
            </Tooltip>
          )}
        </Space>
      </div>
    </Flex>
  );
};

const getRangeByPeriod = (period: PeriodOption): RangeValue => {
  const now = dayjs();

  if (period === 'day') {
    return [now.startOf('day'), now.endOf('day')];
  }

  if (period === 'week') {
    return [now.startOf('week'), now.endOf('week')];
  }

  if (period === 'month') {
    return [now.startOf('month'), now.endOf('month')];
  }

  return [now.startOf('day'), now.endOf('day')];
};

const formatValue = (value?: number | null, digits = 2) => {
  if (value === null || value === undefined) {
    return '--';
  }

  return value.toFixed(digits);
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Something went wrong while loading data.';
};

const metricCards: Array<{
  key: DashboardMetricKey;
  title: string;
  unit: string;
  lineColor: string;
  dataKey: 'avgNoise' | 'avgCrowdDensity';
}> = [
  {
    key: 'noise',
    title: 'Noise',
    unit: 'dB',
    lineColor: '#059669',
    dataKey: 'avgNoise' as const,
  },
  {
    key: 'crowdDensity',
    title: 'Crowd',
    unit: '',
    lineColor: '#7c3aed',
    dataKey: 'avgCrowdDensity' as const,
  },
];

type MiniLineChartProps = {
  data: StoreContextTimeSeriesPoint[];
  dataKey: 'avgNoise' | 'avgCrowdDensity';
  color: string;
  granularity: GranularityOption;
};

const MiniLineChart = ({
  data,
  dataKey,
  color,
  granularity,
}: MiniLineChartProps) => {
  const width = 360;
  const height = 160;
  const padding = 12;
  const chartLeft = padding + 6;
  const chartRight = width - padding;
  const chartTop = padding;
  const chartBottom = height - 34;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const points = data
    .map((point, index) => {
      const value = point[dataKey];
      if (value === null || value === undefined) {
        return null;
      }

      return {
        index,
        value,
        label: dayjs(point.bucketStartUtc).format(
          granularity === 'day' ? 'YYYY-MM-DD' : 'MM-DD HH:00',
        ),
      };
    })
    .filter(
      (point): point is { index: number; value: number; label: string } =>
        !!point,
    );

  const values = points.map((point) => point.value);

  if (values.length < 2) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description='No chart data'
      />
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const diff = max - min || 1;

  const projectedPoints = points.map((point) => {
    const x =
      chartLeft + (point.index / Math.max(data.length - 1, 1)) * chartWidth;
    const normalized = (point.value - min) / diff;
    const y = chartBottom - normalized * chartHeight;

    return {
      ...point,
      x,
      y,
    };
  });

  const polylinePoints = projectedPoints
    .map((point) => `${point.x},${point.y}`)
    .join(' ');

  const areaPoints = [
    `${projectedPoints[0].x},${chartBottom}`,
    ...projectedPoints.map((point) => `${point.x},${point.y}`),
    `${projectedPoints[projectedPoints.length - 1].x},${chartBottom}`,
  ].join(' ');

  const latest = projectedPoints[projectedPoints.length - 1]?.value;

  return (
    <Space
      direction='vertical'
      size={8}
      style={{ width: '100%' }}
    >
      <svg
        width='100%'
        viewBox={`0 0 ${width} ${height}`}
      >
        {[0, 1, 2, 3].map((tick) => {
          const y = chartTop + (tick / 3) * chartHeight;
          return (
            <line
              key={tick}
              x1={chartLeft}
              y1={y}
              x2={chartRight}
              y2={y}
              stroke='#e2e2e6'
              strokeWidth='1'
              strokeDasharray='3 3'
            />
          );
        })}

        <polyline
          fill='rgba(239,68,68,0.04)'
          stroke='none'
          points={areaPoints}
          style={{ color }}
        />

        <polyline
          fill='none'
          stroke={color}
          strokeWidth='2.5'
          points={polylinePoints}
          strokeLinecap='round'
        />

        {projectedPoints.map((point) => (
          <g key={`${point.index}-${point.value}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r='2.6'
              fill={color}
            >
              <title>
                {point.label}: {point.value.toFixed(2)}
              </title>
            </circle>
          </g>
        ))}

        <text
          x={chartLeft}
          y={height - 12}
          fontSize='10'
          fill='#857b80'
        >
          {projectedPoints[0].label}
        </text>
        <text
          x={chartRight}
          y={height - 12}
          fontSize='10'
          fill='#857b80'
          textAnchor='end'
        >
          {projectedPoints[projectedPoints.length - 1].label}
        </text>
      </svg>

      <Flex justify='space-between'>
        <Typography.Text type='secondary'>
          Min: {formatValue(min)}
        </Typography.Text>
        <Typography.Text type='secondary'>
          Max: {formatValue(max)}
        </Typography.Text>
        <Typography.Text strong>Latest: {formatValue(latest)}</Typography.Text>
      </Flex>
    </Space>
  );
};

type LiveNoiseCrowdChartProps = {
  chartId: string;
  spaceTitle: string;
  rows: StoreContextRawLogItem[];
  isFetching: boolean;
  showSpaceHeading?: boolean;
};

const LiveNoiseCrowdChart = ({
  chartId,
  spaceTitle,
  rows,
  isFetching,
  showSpaceHeading = true,
}: LiveNoiseCrowdChartProps) => {
  const gradId = `live-${chartId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const sorted = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          dayjs(a.measuredAtUtc).valueOf() - dayjs(b.measuredAtUtc).valueOf(),
      ),
    [rows],
  );

  const { crowdPts, noisePts, crowdMin, crowdMax, noiseMin, noiseMax } =
    useMemo(() => {
      const cVals: number[] = [];
      const nVals: number[] = [];
      const c: { t: number; v: number }[] = [];
      const n: { t: number; v: number }[] = [];
      for (const r of sorted) {
        const t = dayjs(r.measuredAtUtc).valueOf();
        if (r.crowdDensity != null) {
          c.push({ t, v: r.crowdDensity });
          cVals.push(r.crowdDensity);
        }
        if (r.avgNoise != null) {
          n.push({ t, v: r.avgNoise });
          nVals.push(r.avgNoise);
        }
      }
      return {
        crowdPts: c,
        noisePts: n,
        crowdMin: cVals.length ? Math.min(...cVals) : 0,
        crowdMax: cVals.length ? Math.max(...cVals) : 1,
        noiseMin: nVals.length ? Math.min(...nVals) : 0,
        noiseMax: nVals.length ? Math.max(...nVals) : 1,
      };
    }, [sorted]);

  const width = 520;
  const height = 200;
  const padL = 44;
  const padR = 44;
  const padT = 16;
  const padB = 36;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const tMin = sorted.length
    ? dayjs(sorted[0].measuredAtUtc).valueOf()
    : dayjs().valueOf();
  const tMax = sorted.length
    ? dayjs(sorted[sorted.length - 1].measuredAtUtc).valueOf()
    : tMin + 1;
  const tSpan = Math.max(tMax - tMin, 1);

  const scaleX = (t: number) => padL + ((t - tMin) / tSpan) * innerW;
  const scaleCrowd = (v: number) => {
    const span = Math.max(crowdMax - crowdMin, 1e-6);
    return padT + innerH - ((v - crowdMin) / span) * innerH;
  };
  const scaleNoise = (v: number) => {
    const span = Math.max(noiseMax - noiseMin, 1e-6);
    return padT + innerH - ((v - noiseMin) / span) * innerH;
  };

  const crowdLine =
    crowdPts.length > 0
      ? crowdPts.map((p) => `${scaleX(p.t)},${scaleCrowd(p.v)}`).join(' ')
      : '';
  const noiseLine =
    noisePts.length > 0
      ? noisePts.map((p) => `${scaleX(p.t)},${scaleNoise(p.v)}`).join(' ')
      : '';

  const lastCrowd = crowdPts[crowdPts.length - 1];
  const lastNoise = noisePts[noisePts.length - 1];

  if (sorted.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description='No samples in this window yet.'
      />
    );
  }

  if (!crowdLine && !noiseLine) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description='No crowd / noise values in these rows.'
      />
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {isFetching && (
        <Tag
          color='processing'
          style={{ position: 'absolute', right: 0, top: 0, zIndex: 1 }}
        >
          Updating…
        </Tag>
      )}
      {showSpaceHeading && (
        <Typography.Text
          strong
          style={{ display: 'block', marginBottom: 8 }}
        >
          {spaceTitle}
        </Typography.Text>
      )}
      <svg
        width='100%'
        viewBox={`0 0 ${width} ${height}`}
        style={{
          filter: isFetching ? 'opacity(0.92)' : 'none',
          transition: 'filter 0.35s ease',
        }}
      >
        <defs>
          <linearGradient
            id={`${gradId}-crowd`}
            x1='0'
            y1='0'
            x2='0'
            y2='1'
          >
            <stop
              offset='0%'
              stopColor='#7c3aed'
              stopOpacity='0.35'
            />
            <stop
              offset='100%'
              stopColor='#7c3aed'
              stopOpacity='0.02'
            />
          </linearGradient>
          <linearGradient
            id={`${gradId}-noise`}
            x1='0'
            y1='0'
            x2='0'
            y2='1'
          >
            <stop
              offset='0%'
              stopColor='#059669'
              stopOpacity='0.3'
            />
            <stop
              offset='100%'
              stopColor='#059669'
              stopOpacity='0.02'
            />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((i) => {
          const y = padT + (i / 3) * innerH;
          return (
            <line
              key={i}
              x1={padL}
              y1={y}
              x2={width - padR}
              y2={y}
              stroke='#e2e2e6'
              strokeWidth='1'
            />
          );
        })}

        {crowdLine && crowdPts.length > 1 && (
          <polyline
            fill={`url(#${gradId}-crowd)`}
            stroke='none'
            points={`${scaleX(crowdPts[0].t)},${padT + innerH} ${crowdLine} ${scaleX(crowdPts[crowdPts.length - 1].t)},${padT + innerH}`}
          />
        )}
        {noiseLine && noisePts.length > 1 && (
          <polyline
            fill={`url(#${gradId}-noise)`}
            stroke='none'
            points={`${scaleX(noisePts[0].t)},${padT + innerH} ${noiseLine} ${scaleX(noisePts[noisePts.length - 1].t)},${padT + innerH}`}
          />
        )}

        {crowdLine && (
          <polyline
            fill='none'
            stroke='#7c3aed'
            strokeWidth='2.8'
            strokeLinecap='round'
            strokeLinejoin='round'
            points={crowdLine}
            style={{
              strokeDasharray: 800,
              strokeDashoffset: isFetching ? 40 : 0,
              transition:
                'stroke-dashoffset 0.6s ease, stroke-width 0.25s ease',
            }}
          />
        )}
        {noiseLine && (
          <polyline
            fill='none'
            stroke='#059669'
            strokeWidth='2.8'
            strokeLinecap='round'
            strokeLinejoin='round'
            points={noiseLine}
            style={{
              strokeDasharray: 800,
              strokeDashoffset: isFetching ? 40 : 0,
              transition:
                'stroke-dashoffset 0.6s ease, stroke-width 0.25s ease',
            }}
          />
        )}

        {lastCrowd && (
          <circle
            cx={scaleX(lastCrowd.t)}
            cy={scaleCrowd(lastCrowd.v)}
            r='5'
            fill='#7c3aed'
            className='store-live-dot'
            style={{ animationDelay: '0s' }}
          />
        )}
        {lastNoise && (
          <circle
            cx={scaleX(lastNoise.t)}
            cy={scaleNoise(lastNoise.v)}
            r='5'
            fill='#059669'
            className='store-live-dot'
            style={{ animationDelay: '0.25s' }}
          />
        )}

        <text
          x={4}
          y={padT + 12}
          fontSize='10'
          fill='#7c3aed'
        >
          Crowd
        </text>
        <text
          x={width - padR + 4}
          y={padT + 12}
          fontSize='10'
          fill='#059669'
          textAnchor='end'
        >
          Noise (dB)
        </text>
        <text
          x={padL}
          y={height - 8}
          fontSize='10'
          fill='#857b80'
        >
          {dayjs(tMin).format('HH:mm:ss')}
        </text>
        <text
          x={width - padR}
          y={height - 8}
          fontSize='10'
          fill='#857b80'
          textAnchor='end'
        >
          {dayjs(tMax).format('HH:mm:ss')}
        </text>
      </svg>
      <Flex
        gap={16}
        wrap='wrap'
        style={{ marginTop: 8 }}
      >
        <Typography.Text type='secondary'>
          Crowd:{' '}
          <Typography.Text
            strong
            style={{ color: '#7c3aed' }}
          >
            {lastCrowd ? lastCrowd.v : '—'}
          </Typography.Text>
        </Typography.Text>
        <Typography.Text type='secondary'>
          Noise:{' '}
          <Typography.Text
            strong
            style={{ color: '#059669' }}
          >
            {lastNoise ? `${lastNoise.v.toFixed(1)} dB` : '—'}
          </Typography.Text>
        </Typography.Text>
        <Typography.Text type='secondary'>
          Points: {sorted.length}
        </Typography.Text>
      </Flex>
    </div>
  );
};

export const StoreDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const storeId = useStoreContext();

  // If Brand Manager accesses Store Dashboard without storeId, redirect back to Brand Dashboard
  // Only check once on mount, not on every render
  useEffect(() => {
    const isBrandManagerOnly =
      user?.roles?.includes(RoleEnum.BrandManager) &&
      !user?.roles?.includes(RoleEnum.StoreManager);

    if (isBrandManagerOnly && !storeId) {
      navigate('/brand/stores', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  const [period, setPeriod] = useState<PeriodOption>('day');
  const [granularity, setGranularity] = useState<GranularityOption>('hour');
  const [spaceId, setSpaceId] = useState<string | undefined>(undefined);
  const [range, setRange] = useState<RangeValue>(() => getRangeByPeriod('day'));

  const effectiveRange = useMemo(() => {
    if (period === 'custom') {
      return range;
    }

    return getRangeByPeriod(period);
  }, [period, range]);

  const fromUtc = effectiveRange[0].toDate().toISOString();
  const toUtc = effectiveRange[1].toDate().toISOString();

  const walletQuery = useQuery({
    queryKey: ['store-dashboard', 'wallet'],
    queryFn: async () => {
      const response = await billingService.getWallet();
      return response.data.data ?? null;
    },
    staleTime: STALE_TIME.medium,
  });

  const usageTodayQuery = useQuery({
    queryKey: ['store-dashboard', 'usage-today', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID is required.');
      const today = dayjs().format('YYYY-MM-DD');
      const response = await billingService.getUsage({
        storeId,
        fromBusinessDate: today,
        toBusinessDate: today,
        limit: 200,
      });
      return response.data.data ?? [];
    },
    enabled: !!storeId,
    staleTime: STALE_TIME.short,
  });

  const { data: spaces, isLoading: isLoadingSpaces } = useQuery({
    queryKey: ['store-dashboard', 'spaces', storeId],
    queryFn: async () => {
      if (!storeId) return [] as SpaceListItem[];

      const response = await spaceService.getList({
        page: 1,
        pageSize: 200,
        status: EntityStatusEnum.Active,
      });
      return response.data.items || [];
    },
    enabled: !!storeId,
    staleTime: STALE_TIME.medium,
  });

  const liveLogsQuery = useQuery({
    queryKey: [
      'store-dashboard',
      'live-logs',
      storeId,
      spaceId,
      fromUtc,
      toUtc,
    ],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID is required.');
      const response = await storeService.getContextRawLogs(storeId, {
        page: 1,
        pageSize: LIVE_PAGE_SIZE,
        spaceId,
        fromUtc,
        toUtc,
      });
      return response.data;
    },
    enabled: !!storeId,
    staleTime: 0,
    refetchInterval: LIVE_POLL_MS,
    refetchIntervalInBackground: true,
  });

  const timeSeriesQuery = useQuery({
    queryKey: [
      'store-dashboard',
      'time-series',
      storeId,
      spaceId,
      granularity,
      fromUtc,
      toUtc,
    ],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID is required.');
      const response = await storeService.getContextTimeSeries(storeId, {
        spaceId,
        fromUtc,
        toUtc,
        granularity,
      });
      return response.data.data;
    },
    enabled: !!storeId,
    staleTime: STALE_TIME.short,
  });

  const liveChartsBySpace = useMemo(() => {
    const items = liveLogsQuery.data?.items ?? [];

    if (spaceId) {
      const filtered = items.filter((r) => r.spaceId === spaceId);
      const title =
        filtered[0]?.spaceName ||
        spaces?.find((s) => s.id === spaceId)?.name ||
        'Selected space';
      return [{ key: spaceId, title, rows: filtered }];
    }

    const map = new Map<
      string,
      { title: string; rows: StoreContextRawLogItem[] }
    >();

    // Always include all active spaces, even when telemetry is empty in current window.
    (spaces ?? []).forEach((s) => {
      map.set(s.id, { title: s.name, rows: [] });
    });

    for (const r of items) {
      const key = r.spaceId || r.spaceName;
      if (!map.has(key)) {
        map.set(key, { title: r.spaceName, rows: [] });
      }
      map.get(key)!.rows.push(r);
    }

    return Array.from(map.entries()).map(([key, v]) => ({
      key,
      title: v.title,
      rows: v.rows,
    }));
  }, [liveLogsQuery.data?.items, spaceId, spaces]);

  const idsToPollPlayback = useMemo(() => {
    const fromCharts = liveChartsBySpace
      .map((b) => resolveSpaceIdForPlayback(b.key, b.title, spaces))
      .filter((id): id is string => !!id);
    if (fromCharts.length > 0) {
      return [...new Set(fromCharts)];
    }
    if (spaceId) return [spaceId];
    return (spaces ?? []).map((s) => s.id);
  }, [liveChartsBySpace, spaceId, spaces]);

  const playbackStateQueries = useQueries({
    queries: idsToPollPlayback.map((id) => ({
      queryKey: ['store-dashboard', 'space-playback-state', id] as const,
      queryFn: async (): Promise<SpaceStateResponse | null> => {
        const res = await camsService.getSpaceState(id);
        const body = res.data;
        if (!body?.isSuccess || !body.data) return null;
        return body.data;
      },
      enabled: !!storeId && idsToPollPlayback.length > 0,
      staleTime: 0,
      refetchInterval: LIVE_POLL_MS,
      refetchIntervalInBackground: true,
    })),
  });

  const playbackStateBySpaceId = useMemo(() => {
    const m = new Map<string, PlaybackPollSlot>();
    idsToPollPlayback.forEach((sid, i) => {
      const q = playbackStateQueries[i];
      m.set(sid, {
        state: q?.data ?? null,
        isPending: q?.isPending ?? false,
        isFetching: q?.isFetching ?? false,
      });
    });
    return m;
  }, [idsToPollPlayback, playbackStateQueries]);

  const handlePeriodChange = (value: string | number) => {
    const nextPeriod = value as PeriodOption;
    setPeriod(nextPeriod);
    if (nextPeriod !== 'custom') {
      setRange(getRangeByPeriod(nextPeriod));
    }
  };

  const handleResetFilters = () => {
    setPeriod('day');
    setRange(getRangeByPeriod('day'));
    setGranularity('hour');
    setSpaceId(undefined);
  };

  const isAnyRefreshing =
    liveLogsQuery.isFetching || timeSeriesQuery.isFetching;

  const activeSpacesCount = spaces?.length ?? 0;
  const todayStreamTokens = (usageTodayQuery.data ?? [])
    .filter((u) => u.usageType === 'StreamingSpaceDaily')
    .reduce((sum, u) => sum + u.tokensCharged, 0);
  const playbackSlots = Array.from(playbackStateBySpaceId.values());
  const playingSpacesCount = playbackSlots.filter((slot) => {
    const state = slot.state;
    return Boolean(
      (state?.hlsUrl || state?.currentTrackName) && !state?.isPaused,
    );
  }).length;
  const attentionSpacesCount = playbackSlots.filter((slot) => {
    const state = slot.state;
    const iotStatus = getIotStatusFromSpaceState(state);
    return iotStatus !== 'Online' || state?.isPaused;
  }).length;
  const latestSamplesCount = liveLogsQuery.data?.items?.length ?? 0;
  const latestLogBySpaceId = useMemo(
    () => buildLatestContextLogBySpace(liveLogsQuery.data?.items ?? []),
    [liveLogsQuery.data?.items],
  );

  const liveSpaceRows: SpaceHealthRow[] = useMemo(() => {
    const sourceSpaces = (spaces ?? []).filter((space) =>
      spaceId ? space.id === spaceId : true,
    );

    return sourceSpaces.map((space) => {
      const latest = getLatestContextLogForSpace(latestLogBySpaceId, space);
      const slot = playbackStateBySpaceId.get(space.id);
      const state = slot?.state;
      const playbackStatus: SpaceHealthRow['playbackStatus'] = slot?.isPending
        ? 'Loading'
        : state?.isPaused
          ? 'Paused'
          : state?.hlsUrl || state?.currentTrackName
            ? 'Playing'
            : 'Idle';
      const iotStatus = getIotStatusFromSpaceState(state);

      return {
        key: space.id,
        spaceName: space.name,
        peopleNow: latest?.crowdDensity ?? null,
        noiseNow: latest?.avgNoise ?? null,
        moodName: latest?.moodName || state?.moodName || null,
        currentTrack: state?.currentTrackName ?? null,
        playbackStatus,
        iotStatus,
        lastUpdatedUtc:
          latest?.measuredAtUtc ?? state?.lastTelemetryAtUtc ?? null,
      };
    });
  }, [latestLogBySpaceId, playbackStateBySpaceId, spaceId, spaces]);

  const totalPeopleNow = sumLivePeopleRows(liveSpaceRows);
  const spacesWithPeopleSamples = liveSpaceRows.filter(
    (row) => row.peopleNow != null,
  ).length;
  const iotOnlineCount = liveSpaceRows.filter(
    (row) => row.iotStatus === 'Online',
  ).length;
  const iotKnownCount = liveSpaceRows.length;
  const liveSpaceColumns: ColumnsType<SpaceHealthRow> = [
    {
      title: 'Space',
      dataIndex: 'spaceName',
      key: 'spaceName',
      fixed: 'left',
      width: 180,
      render: (value: string, row) => (
        <Space
          direction='vertical'
          size={2}
        >
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text style={{ color: '#857b80', fontSize: 12 }}>
            {row.lastUpdatedUtc
              ? `Updated ${dayjs(row.lastUpdatedUtc).format('HH:mm:ss')}`
              : 'No sensor sample today'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'People',
      dataIndex: 'peopleNow',
      key: 'peopleNow',
      align: 'center',
      width: 110,
      render: (value: number | null) => (
        <Typography.Text
          strong
          style={{ color: '#f8f7f7' }}
        >
          {value == null ? '--' : formatValue(value, 0)}
        </Typography.Text>
      ),
    },
    {
      title: 'Noise',
      dataIndex: 'noiseNow',
      key: 'noiseNow',
      align: 'center',
      width: 110,
      render: (value: number | null) =>
        value == null ? '--' : `${formatValue(value)} dB`,
    },
    {
      title: 'Mood',
      dataIndex: 'moodName',
      key: 'moodName',
      width: 130,
      render: (value: string | null) =>
        value ? <Tag color='default'>{value}</Tag> : '--',
    },
    {
      title: 'IoT',
      dataIndex: 'iotStatus',
      key: 'iotStatus',
      width: 130,
      render: (value: SpaceHealthRow['iotStatus']) => {
        const color =
          value === 'Online'
            ? 'success'
            : value === 'Offline'
              ? 'error'
              : value === 'Stale' || value === 'Not paired'
                ? 'warning'
                : 'default';
        return <Tag color={color}>{value}</Tag>;
      },
    },
    {
      title: 'Playback',
      dataIndex: 'playbackStatus',
      key: 'playbackStatus',
      width: 130,
      render: (value: SpaceHealthRow['playbackStatus']) => {
        const color =
          value === 'Playing'
            ? 'success'
            : value === 'Paused'
              ? 'warning'
              : value === 'Loading'
                ? 'processing'
                : 'default';
        return <Tag color={color}>{value}</Tag>;
      },
    },
    {
      title: 'Current Track',
      dataIndex: 'currentTrack',
      key: 'currentTrack',
      ellipsis: true,
      render: (value: string | null) => value || 'No track playing',
    },
  ];

  return (
    <div>
      <style>
        {`
          @keyframes store-live-pulse {
            0%, 100% { opacity: 1; filter: drop-shadow(0 0 4px currentColor); }
            50% { opacity: 0.35; filter: drop-shadow(0 0 10px currentColor); }
          }
          .store-live-dot {
            animation: store-live-pulse 1.5s ease-in-out infinite;
          }
          @keyframes store-now-playing-beat {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.08); opacity: 0.85; }
          }
          .store-now-playing-icon {
            animation: store-now-playing-beat 1.4s ease-in-out infinite;
          }
        `}
      </style>
      <PageHeader
        title='Store Manager Dashboard'
        breadcrumbs={[{ title: 'Store' }, { title: 'Dashboard' }]}
        seo={{
          description:
            'Monitor playback, spaces, token health, and live store telemetry.',
          keywords: 'store dashboard, playback, space health, telemetry',
        }}
      />

      {!storeId && (
        <Alert
          type='warning'
          showIcon
          message='Store scope is missing. Please re-login.'
          className='mb-4!'
        />
      )}

      <div
        style={{
          ...dashboardCardStyle,
          padding: 24,
          marginBottom: 16,
          background:
            'radial-gradient(circle at top left, rgba(248,68,68,0.22), transparent 34%), linear-gradient(135deg, rgba(49,18,22,0.96), rgba(18,18,20,0.96) 52%, rgba(10,10,12,0.98))',
        }}
      >
        <Flex
          justify='space-between'
          align='flex-start'
          wrap='wrap'
          gap={16}
        >
          <div style={{ maxWidth: 720 }}>
            <Typography.Text
              style={{
                color: '#fca5a5',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              Store manager
            </Typography.Text>
            <Typography.Title
              level={2}
              style={{ margin: '4px 0 8px', color: '#f8f7f7' }}
            >
              Live Store Health
            </Typography.Title>
            <Typography.Text style={{ color: '#c5b8bd', fontSize: 15 }}>
              Check what is playing, which spaces need attention, and whether
              the store has enough tokens to keep music running.
            </Typography.Text>
          </div>

          <Space wrap>
            <Tag color='default'>{latestSamplesCount} telemetry samples</Tag>
            {isAnyRefreshing && <Tag color='processing'>Updating</Tag>}
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                walletQuery.refetch();
                usageTodayQuery.refetch();
                liveLogsQuery.refetch();
                timeSeriesQuery.refetch();
              }}
            >
              Refresh live data
            </Button>
          </Space>
        </Flex>
      </div>

      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 16 }}
      >
        <Col
          xs={24}
          sm={12}
          xl={6}
        >
          <StatTile
            icon={<SoundOutlined />}
            label='People now'
            value={formatValue(totalPeopleNow, 0)}
            detail={`${spacesWithPeopleSamples}/${activeSpacesCount} spaces reporting`}
            tone={spacesWithPeopleSamples > 0 ? 'good' : 'warn'}
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          xl={6}
        >
          <StatTile
            icon={<ThunderboltOutlined />}
            label='IoT online'
            value={`${iotOnlineCount}/${activeSpacesCount}`}
            detail={
              iotKnownCount === 0
                ? 'waiting for device status'
                : 'paired devices reporting'
            }
            tone={
              iotKnownCount === 0
                ? 'warn'
                : iotOnlineCount === activeSpacesCount
                  ? 'good'
                  : 'danger'
            }
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          xl={6}
        >
          <StatTile
            icon={<PlayCircleOutlined />}
            label='Playing now'
            value={playingSpacesCount}
            detail={`checked every ${LIVE_POLL_MS / 1000}s`}
            tone={playingSpacesCount > 0 ? 'good' : 'warn'}
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          xl={6}
        >
          <StatTile
            icon={<WalletOutlined />}
            label='Needs attention'
            value={attentionSpacesCount}
            detail='offline, paused, or no IoT'
            tone={attentionSpacesCount > 0 ? 'danger' : 'good'}
          />
        </Col>
      </Row>

      <Card
        title='Live Space Status'
        style={{ marginBottom: 16, ...dashboardCardStyle }}
        styles={{ body: panelBodyStyle }}
        extra={
          <Space wrap>
            <Tag color='default'>{activeSpacesCount} spaces</Tag>
            <Tag color='processing'>Refreshes every {LIVE_POLL_MS / 1000}s</Tag>
          </Space>
        }
      >
        <Table<SpaceHealthRow>
          rowKey='key'
          columns={liveSpaceColumns}
          dataSource={liveSpaceRows}
          loading={isLoadingSpaces || liveLogsQuery.isLoading}
          pagination={false}
          scroll={{ x: 900 }}
          locale={{
            emptyText: 'No active spaces found for this store.',
          }}
        />
      </Card>

      {/* ── Token Wallet Overview ── */}
      <Card
        style={{ marginBottom: 16, ...dashboardCardStyle }}
        styles={{ body: panelBodyStyle }}
        title={
          <Flex
            align='center'
            gap={8}
          >
            <WalletOutlined />
            <span>Wallet Health</span>
            {walletQuery.data?.isLocked && (
              <Tooltip
                title={`Locked from ${walletQuery.data.lockedFromBusinessDate ?? ''}`}
              >
                <Tag
                  icon={<LockOutlined />}
                  color='error'
                >
                  Locked
                </Tag>
              </Tooltip>
            )}
          </Flex>
        }
        extra={
          <Button
            size='small'
            icon={<ReloadOutlined />}
            onClick={() => {
              walletQuery.refetch();
              usageTodayQuery.refetch();
            }}
          >
            Refresh
          </Button>
        }
      >
        {walletQuery.isLoading ? (
          <Skeleton
            active
            paragraph={{ rows: 1 }}
          />
        ) : walletQuery.isError ? (
          <Alert
            type='error'
            showIcon
            message='Failed to load wallet'
          />
        ) : (
          <Row
            gutter={[24, 16]}
            align='middle'
          >
            <Col
              xs={24}
              sm={8}
            >
              <Statistic
                title='Token Balance'
                value={walletQuery.data?.balanceTokens ?? 0}
                valueStyle={{
                  color:
                    (walletQuery.data?.balanceTokens ?? 0) < 0
                      ? '#fca5a5'
                      : '#86efac',
                  fontWeight: 700,
                }}
                suffix='tokens'
              />
            </Col>
            <Col
              xs={24}
              sm={8}
            >
              <Statistic
                title='Status'
                value={walletQuery.data?.lockStatus ?? '--'}
                valueStyle={{
                  color: walletQuery.data?.isLocked ? '#fca5a5' : '#86efac',
                  fontSize: 16,
                  fontWeight: 700,
                }}
              />
            </Col>
            <Col
              xs={24}
              sm={8}
            >
              <Statistic
                title="Today's Usage (streams)"
                loading={usageTodayQuery.isLoading}
                valueStyle={{ color: '#f8f7f7', fontWeight: 700 }}
                value={todayStreamTokens}
                suffix='tokens'
              />
            </Col>
          </Row>
        )}
      </Card>

      {walletQuery.data?.isLocked && (
        <Alert
          type='error'
          showIcon
          className='mb-4!'
          icon={<LockOutlined />}
          message='Playback & AI generation are locked'
          description={`Wallet is locked from ${walletQuery.data.lockedFromBusinessDate ?? 'an earlier date'}. Please top up tokens to resume.`}
        />
      )}

      <Card
        title='Time & Space Filters'
        style={{ display: 'none', marginBottom: 16, ...dashboardCardStyle }}
        styles={{ body: panelBodyStyle }}
      >
        <Space
          direction='vertical'
          size='middle'
          style={{ width: '100%' }}
        >
          <Flex
            justify='space-between'
            wrap='wrap'
            gap={12}
          >
            <Space wrap>
              <Segmented
                size='large'
                value={period}
                onChange={handlePeriodChange}
                options={[
                  { label: 'Day', value: 'day' },
                  { label: 'Week', value: 'week' },
                  { label: 'Month', value: 'month' },
                  { label: 'Custom', value: 'custom' },
                ]}
              />

              <DatePicker.RangePicker
                size='large'
                value={range}
                onChange={(value) => {
                  if (!value || !value[0] || !value[1]) return;
                  setRange([value[0], value[1]]);
                  if (period !== 'custom') {
                    setPeriod('custom');
                  }
                }}
                showTime
                allowClear={false}
              />
            </Space>

            <Space wrap>
              <Select
                size='large'
                style={{ width: 260 }}
                placeholder='Filter by space'
                value={spaceId}
                onChange={(value) => {
                  setSpaceId(value);
                }}
                allowClear
                loading={isLoadingSpaces}
                showSearch
                optionFilterProp='label'
                options={(spaces || []).map((space) => ({
                  label: space.name,
                  value: space.id,
                }))}
              />

              <Select
                size='large'
                style={{ width: 180 }}
                placeholder='Chart granularity'
                value={granularity}
                onChange={(value: GranularityOption) => setGranularity(value)}
                options={[
                  { label: 'By Hour', value: 'hour' },
                  { label: 'By Day', value: 'day' },
                ]}
              />

              <Button
                size='large'
                icon={<ReloadOutlined />}
                onClick={() => {
                  liveLogsQuery.refetch();
                  timeSeriesQuery.refetch();
                }}
              >
                Refresh
              </Button>

              <Button
                size='large'
                onClick={handleResetFilters}
              >
                Reset Filters
              </Button>
            </Space>
          </Flex>

          <Typography.Text type='secondary'>
            Window: {dayjs(fromUtc).format('YYYY-MM-DD HH:mm')} -{' '}
            {dayjs(toUtc).format('YYYY-MM-DD HH:mm')} (UTC)
          </Typography.Text>

          <Typography.Text type='secondary'>
            Live charts refresh every {LIVE_POLL_MS / 1000}s (up to{' '}
            {LIVE_PAGE_SIZE} recent rows per request).
          </Typography.Text>

          {isAnyRefreshing &&
            !liveLogsQuery.isLoading &&
            !timeSeriesQuery.isLoading && (
              <Tag color='processing'>Updating…</Tag>
            )}
        </Space>
      </Card>

      {timeSeriesQuery.isError && (
        <Alert
          type='error'
          showIcon
          className='mb-4!'
          message='Failed to load time-series analytics'
          description={getErrorMessage(timeSeriesQuery.error)}
        />
      )}

      {liveLogsQuery.isError && (
        <Alert
          type='error'
          showIcon
          className='mb-4!'
          message='Failed to load live telemetry'
          description={getErrorMessage(liveLogsQuery.error)}
        />
      )}

      <Card
        title='Live Space Operations'
        style={{ display: 'none', marginTop: 16, ...dashboardCardStyle }}
        styles={{ body: panelBodyStyle }}
        extra={
          <Space>
            <Tag color='processing'>Live every {LIVE_POLL_MS / 1000}s</Tag>
          </Space>
        }
      >
        {liveLogsQuery.isLoading && !liveLogsQuery.data ? (
          <Flex
            justify='center'
            style={{ padding: '28px 0' }}
          >
            <Spin size='large' />
          </Flex>
        ) : liveChartsBySpace.length === 0 ? (
          <Space
            direction='vertical'
            size='large'
            style={{ width: '100%' }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='No telemetry in this window. Adjust filters or wait for new samples.'
            />
            {idsToPollPlayback.length > 0 && (
              <>
                <Typography.Title
                  level={5}
                  style={{ marginBottom: 0 }}
                >
                  Now playing (realtime)
                </Typography.Title>
                <Typography.Paragraph
                  type='secondary'
                  style={{ marginTop: 0 }}
                >
                  Track name updates every {LIVE_POLL_MS / 1000}s from CAMS
                  state.
                </Typography.Paragraph>
                <Row gutter={[16, 16]}>
                  {idsToPollPlayback.map((sid) => {
                    const label =
                      spaces?.find((s) => s.id === sid)?.name ?? sid;
                    return (
                      <Col
                        xs={24}
                        md={12}
                        key={sid}
                      >
                        <Card
                          size='small'
                          style={{
                            background: 'rgba(255,255,255,0.035)',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}
                          styles={{ body: { background: 'transparent' } }}
                        >
                          <NowPlayingBanner
                            spaceLabel={label}
                            slot={playbackStateBySpaceId.get(sid)}
                          />
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </>
            )}
          </Space>
        ) : (
          <Row gutter={[20, 24]}>
            {liveChartsBySpace.map((block) => {
              const sid = resolveSpaceIdForPlayback(
                block.key,
                block.title,
                spaces,
              );
              const playbackSlot = sid
                ? playbackStateBySpaceId.get(sid)
                : undefined;
              return (
                <Col
                  xs={24}
                  lg={spaceId ? 24 : 12}
                  key={block.key}
                >
                  <Card
                    size='small'
                    style={{
                      background: 'rgba(255,255,255,0.035)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    styles={{
                      body: { background: 'transparent', borderRadius: 8 },
                    }}
                  >
                    <NowPlayingBanner
                      spaceLabel={block.title}
                      slot={playbackSlot}
                    />
                    <LiveNoiseCrowdChart
                      chartId={block.key}
                      spaceTitle={block.title}
                      rows={block.rows}
                      isFetching={liveLogsQuery.isFetching}
                      showSpaceHeading={false}
                    />
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>

      <Card
        title='Context Trends'
        style={{ display: 'none', marginTop: 16, ...dashboardCardStyle }}
        styles={{ body: panelBodyStyle }}
      >
        {timeSeriesQuery.isLoading ? (
          <Flex
            justify='center'
            style={{ padding: '28px 0' }}
          >
            <Spin size='large' />
          </Flex>
        ) : (timeSeriesQuery.data?.points?.length || 0) === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description='No time-series data for this range.'
          />
        ) : (
          <Row gutter={[16, 16]}>
            {metricCards.map((metric) => (
              <Col
                xs={24}
                md={12}
                key={metric.key}
              >
                <Card
                  size='small'
                  title={metric.title}
                  style={{
                    background: 'rgba(255,255,255,0.035)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  styles={{ body: { background: 'transparent' } }}
                >
                  <MiniLineChart
                    data={timeSeriesQuery.data?.points || []}
                    dataKey={metric.dataKey}
                    color={metric.lineColor}
                    granularity={granularity}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
};
