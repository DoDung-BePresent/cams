import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Badge, Col, Empty, Progress, Row, Segmented, Skeleton, Tag, Typography } from 'antd';
import {
  AudioOutlined,
  CalendarOutlined,
  CustomerServiceOutlined,
  LeftOutlined,
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

import { useAuth } from '@/providers';
import {
  BrandDashboardPeriodEnum,
  BrandStoreHealthStatusEnum,
  IotHealthStatusEnum,
  TrackScopeEnum,
  WalletLockStatusEnum,
  type BrandDashboardIotSpaceHealthItem,
  type BrandDashboardTopTrackItem,
  type BrandLivePlaybackQueueItem,
  type BrandLivePlaybackSpaceItem,
} from '@/features/brand/types';
import { useBrandDashboard, useBrandDashboardRealtime } from '@/features/brand/hooks';
import { SPACE_TYPE_LABELS } from '@/shared/modules/spaces/constants';

const { Title, Text } = Typography;

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
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value ?? 0);

const formatAgo = (value?: string | null) => {
  if (!value) return 'No data';
  const seconds = Math.max(0, dayjs().diff(dayjs(value), 'second'));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
};

const getMoodTheme = (moodName?: string | null) => {
  const mood = moodName?.toLowerCase() ?? '';
  if (mood.includes('chill') || mood.includes('calm')) return { color: C.chill, bg: 'rgba(16,185,129,0.14)', label: 'Chill' };
  if (mood.includes('focus')) return { color: C.blue, bg: 'rgba(59,130,246,0.14)', label: 'Focus' };
  if (mood.includes('energetic') || mood.includes('uplifting') || mood.includes('social')) return { color: C.orange, bg: 'rgba(245,158,11,0.14)', label: 'Energetic' };
  return { color: C.indigo, bg: 'rgba(129,140,248,0.14)', label: moodName || 'Mood' };
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

const Panel = ({ title, extra, children, minHeight }: { title: string; extra?: ReactNode; children: ReactNode; minHeight?: number }) => (
  <section style={panel(minHeight)}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 14px 0' }}>
      <Text style={{ color: C.text, fontSize: 13, fontWeight: 800 }}>{title}</Text>
      {extra ?? <Text style={{ color: '#60a5fa', fontSize: 11, fontWeight: 800 }}>View all</Text>}
    </div>
    <div style={{ padding: 14 }}>{children}</div>
  </section>
);

const KpiCard = ({ icon, label, value, detail, accent = C.red, loading }: { icon: ReactNode; label: string; value: string; detail?: string; accent?: string; loading?: boolean }) => (
  <div style={{ ...panel(108), padding: 15 }}>
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: `${accent}1f`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <Text style={{ color: C.muted, fontSize: 11, fontWeight: 800 }}>{label}</Text>
        <div style={{ marginTop: 7 }}>
          {loading ? <Skeleton.Input active size='small' style={{ width: 78 }} /> : <span style={{ color: C.text, fontSize: 25, fontWeight: 900 }}>{value}</span>}
        </div>
        {detail ? <Text style={{ color: C.subtle, fontSize: 11 }}>{detail}</Text> : null}
      </div>
    </div>
  </div>
);

const WaveVisualizer = ({ color, playing }: { color: string; playing: boolean }) => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 8, opacity: playing ? 1 : 0.56 }}>
    <style>{`
      @keyframes bmWaveFloat { 0%,100% { transform: translateX(-12px); } 50% { transform: translateX(12px); } }
      @keyframes bmWavePulse { 0%,100% { opacity: .42; } 50% { opacity: 1; } }
    `}</style>
    {[0, 1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: '9%',
          top: `${30 + i * 10}%`,
          width: '82%',
          height: 28 + i * 10,
          borderRadius: '50%',
          border: `1px solid ${color}${i === 0 ? 'aa' : '55'}`,
          animation: playing ? `bmWaveFloat ${1.2 + i * 0.2}s ease-in-out infinite, bmWavePulse ${1.1 + i * 0.15}s ease-in-out infinite` : undefined,
        }}
      />
    ))}
  </div>
);

const getProgress = (space: BrandLivePlaybackSpaceItem) => {
  if (!space.startedAtUtc || !space.expectedEndAtUtc) return 0;
  const start = dayjs(space.startedAtUtc).valueOf();
  const end = dayjs(space.expectedEndAtUtc).valueOf();
  if (end <= start) return 0;
  return Math.max(0, Math.min(100, ((Date.now() - start) / (end - start)) * 100));
};

const buildQueueRows = (space: BrandLivePlaybackSpaceItem, topTracks: BrandDashboardTopTrackItem[]): BrandLivePlaybackQueueItem[] => {
  const explicit = space.queueItems?.filter(Boolean) ?? [];
  if (explicit.length) return explicit.slice(0, 3);
  const rows: BrandLivePlaybackQueueItem[] = [{
    queueItemId: space.trackId ?? space.spaceId,
    trackId: space.trackId,
    trackName: space.trackName || 'No track playing',
    artist: space.artist,
    position: 1,
    queueStatus: 1,
  }];
  topTracks.filter((track) => track.trackId !== space.trackId).slice(0, 2).forEach((track, index) => rows.push({
    queueItemId: track.trackId ?? `${space.spaceId}-${index}`,
    trackId: track.trackId,
    trackName: track.trackName,
    artist: track.artist,
    position: index + 2,
    queueStatus: 0,
  }));
  return rows;
};

const LivePlayback = ({ items, iotBySpace, topTracks, loading }: { items: BrandLivePlaybackSpaceItem[]; iotBySpace: Map<string, BrandDashboardIotSpaceHealthItem>; topTracks: BrandDashboardTopTrackItem[]; loading?: boolean }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[Math.min(activeIndex, Math.max(items.length - 1, 0))];
  const go = (dir: -1 | 1) => items.length && setActiveIndex((current) => (current + dir + items.length) % items.length);

  if (loading) return <Panel title='Live Playback' minHeight={358}><Skeleton active paragraph={{ rows: 8 }} /></Panel>;
  if (!active) return <Panel title='Live Playback' minHeight={358}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='No spaces are playing' /></Panel>;

  const mood = getMoodTheme(active.moodName);
  const iot = getIotMeta(iotBySpace.get(active.spaceId)?.healthStatus);
  const playing = Boolean(active.trackId) && !active.isPaused;
  const queueRows = buildQueueRows(active, topTracks);

  return (
    <Panel title='Live Playback' minHeight={358}>
      <div style={{ position: 'relative', border: `1px solid ${mood.color}55`, borderRadius: 8, padding: 14, background: 'radial-gradient(circle at 33% 34%, rgba(59,130,246,0.24), transparent 34%), linear-gradient(145deg, #111113 0%, #0b0b0e 100%)', overflow: 'hidden' }}>
        <button onClick={() => go(-1)} style={navButton('left')} aria-label='Previous space'><LeftOutlined /></button>
        <button onClick={() => go(1)} style={navButton('right')} aria-label='Next space'><RightOutlined /></button>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{ minWidth: 0 }}>
            <Text ellipsis style={{ color: C.text, display: 'block', fontSize: 13, fontWeight: 900 }}>{active.spaceName} - {active.storeName}</Text>
            <Text style={{ color: C.subtle, fontSize: 11 }}>{SPACE_TYPE_LABELS[active.spaceType] ?? 'Space'}</Text>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Tag color={active.isPaused ? 'warning' : 'error'} style={{ margin: 0, fontSize: 10 }}>{active.isPaused ? 'Paused' : 'Now Playing'}</Tag>
            <Tag color={iot.tag} style={{ margin: 0, fontSize: 10 }}>{iot.label}</Tag>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) minmax(150px, .85fr)', gap: 14, alignItems: 'center' }}>
          <div>
            <div style={{ minHeight: 150, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <WaveVisualizer color={mood.color} playing={playing} />
              <div style={{ position: 'relative', zIndex: 2, width: 126, height: 126, borderRadius: '50%', background: `radial-gradient(circle at 40% 35%, ${mood.color}66 0%, rgba(15,23,42,.94) 100%)`, border: `1px solid ${mood.color}55`, boxShadow: playing ? `0 0 46px ${mood.color}66, inset 0 0 32px rgba(0,0,0,.52)` : `0 0 18px ${mood.color}2f`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SoundOutlined style={{ color: mood.color, fontSize: 44 }} />
              </div>
            </div>
            <Progress percent={Math.round(getProgress(active))} showInfo={false} strokeColor={C.red} trailColor='rgba(255,255,255,.11)' size='small' />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
              <Text style={{ color: C.subtle, fontSize: 10 }}>{active.startedAtUtc ? dayjs(active.startedAtUtc).format('HH:mm') : '--:--'}</Text>
              <Text style={{ color: C.subtle, fontSize: 10 }}>{active.expectedEndAtUtc ? dayjs(active.expectedEndAtUtc).format('HH:mm') : '--:--'}</Text>
            </div>
          </div>

          <div style={{ minWidth: 0 }}>
            <Text ellipsis style={{ color: C.text, display: 'block', fontSize: 18, fontWeight: 900 }}>{active.trackName || 'No track playing'}</Text>
            <Text ellipsis style={{ color: C.muted, display: 'block', fontSize: 12, marginTop: 2 }}>{active.artist || 'Unknown artist'}</Text>
            <Tag style={{ margin: '10px 0 14px', color: mood.color, borderColor: `${mood.color}77`, background: mood.bg, fontWeight: 800 }}>{active.moodName || mood.label}</Tag>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 11, padding: '9px 14px', borderRadius: 999, background: 'rgba(255,255,255,.055)', border: `1px solid ${C.borderSoft}` }}>
              <StepBackwardOutlined style={{ color: C.muted }} />
              <span style={{ width: 40, height: 40, borderRadius: '50%', background: playing ? C.red : C.blue, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}</span>
              <StepForwardOutlined style={{ color: C.muted }} />
              {active.isMuted ? <MutedOutlined style={{ color: C.red }} /> : <SoundOutlined style={{ color: C.muted }} />}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
            <Text style={{ color: C.muted, fontSize: 11, fontWeight: 900 }}>Space Queue</Text>
            <Text style={{ color: C.subtle, fontSize: 11 }}>{queueRows.length} track(s)</Text>
          </div>
          <div style={{ display: 'grid', gap: 5 }}>
            {queueRows.map((queue, index) => {
              const current = index === 0;
              return (
                <div key={queue.queueItemId ?? `${active.spaceId}-${index}`} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 8, alignItems: 'center', padding: '6px 8px', borderRadius: 6, background: current ? `${C.red}14` : 'rgba(255,255,255,.035)', border: `1px solid ${current ? `${C.red}55` : C.borderSoft}` }}>
                  <Text style={{ color: current ? C.red : C.subtle, fontSize: 10, fontWeight: 900 }}>{current ? 'Playing' : `#${index + 1}`}</Text>
                  <Text ellipsis style={{ color: C.text, fontSize: 11 }}>{queue.trackName || 'Unknown track'}</Text>
                  <Text ellipsis style={{ color: C.subtle, fontSize: 10 }}>{queue.artist || '--'}</Text>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 9 }}>
        {items.map((space, index) => <button key={space.spaceId} onClick={() => setActiveIndex(index)} style={{ width: index === activeIndex ? 18 : 6, height: 6, border: 0, borderRadius: 99, background: index === activeIndex ? C.red : 'rgba(255,255,255,.2)', cursor: 'pointer' }} />)}
        <Text style={{ color: C.subtle, fontSize: 10, marginLeft: 5 }}>{activeIndex + 1} / {items.length}</Text>
      </div>
    </Panel>
  );
};

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

const StoreHealth = ({ data, loading }: { data: ReturnType<typeof useBrandDashboard>['data']; loading?: boolean }) => {
  const rows = data?.storeHealth ?? [];
  const healthy = rows.filter((row) => row.healthStatus === BrandStoreHealthStatusEnum.Healthy).length;
  const warning = rows.filter((row) => row.healthStatus === BrandStoreHealthStatusEnum.Attention).length;
  return (
    <Panel title='Store Health' minHeight={292}>
      {loading ? <Skeleton active paragraph={{ rows: 6 }} /> : rows.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : <>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 14 }}>
          <Progress type='circle' percent={data?.overview.totalStores ? Math.round((healthy / data.overview.totalStores) * 100) : 0} size={94} strokeColor={C.green} trailColor='rgba(255,255,255,.08)' format={() => <div><div style={{ color: C.text, fontSize: 22, fontWeight: 900 }}>{formatNumber(data?.overview.totalStores)}</div><div style={{ color: C.subtle, fontSize: 9 }}>Total Stores</div></div>} />
          <div style={{ flex: 1, display: 'grid', gap: 7 }}>
            {[{ label: 'Healthy', value: healthy, color: C.green }, { label: 'Warning', value: warning, color: C.orange }, { label: 'Inactive', value: data?.overview.inactiveStores ?? 0, color: C.subtle }].map((item) => <div key={item.label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ width: 7, height: 7, borderRadius: 99, background: item.color }} /><Text style={{ color: C.muted, flex: 1, fontSize: 12 }}>{item.label}</Text><Text style={{ color: C.text, fontSize: 12, fontWeight: 800 }}>{item.value}</Text></div>)}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>{rows.slice(0, 6).map((row) => <div key={row.storeId} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center' }}><Text ellipsis style={{ color: C.muted, fontSize: 12 }}>{row.storeName}</Text><Tag color={row.healthStatus === BrandStoreHealthStatusEnum.Healthy ? 'success' : row.healthStatus === BrandStoreHealthStatusEnum.Attention ? 'warning' : 'default'} style={{ margin: 0, fontSize: 10 }}>{row.healthStatus === BrandStoreHealthStatusEnum.Healthy ? 'Healthy' : row.healthStatus === BrandStoreHealthStatusEnum.Attention ? 'Warning' : 'Inactive'}</Tag><Text style={{ color: C.green, fontSize: 12, fontWeight: 800 }}>{row.playingSpaces}/{row.activeSpaces}</Text></div>)}</div>
      </>}
    </Panel>
  );
};

const IotHealth = ({ rows, loading }: { rows: BrandDashboardIotSpaceHealthItem[]; loading?: boolean }) => (
  <Panel title='IoT Space Health' minHeight={292}>
    {loading ? <Skeleton active paragraph={{ rows: 7 }} /> : rows.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto auto', gap: 8, color: C.subtle, fontSize: 10, fontWeight: 800 }}><span>Space</span><span>Store</span><span>Status</span><span>Last seen</span></div>
      {rows.slice(0, 7).map((row) => { const meta = getIotMeta(row.healthStatus); return <div key={row.spaceId} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto auto', gap: 8, alignItems: 'center' }}><Text ellipsis style={{ color: C.text, fontSize: 12 }}>{row.spaceName}</Text><Text ellipsis style={{ color: C.muted, fontSize: 12 }}>{row.storeName}</Text><Tag color={meta.tag} style={{ margin: 0, fontSize: 10 }}>{meta.label}</Tag><Text style={{ color: C.subtle, fontSize: 11 }}>{formatAgo(row.lastTelemetryAtUtc)}</Text></div>; })}
    </div>}
  </Panel>
);

const TopTracks = ({ tracks, loading }: { tracks: BrandDashboardTopTrackItem[]; loading?: boolean }) => (
  <Panel title='Top Tracks' minHeight={258}>
    {loading ? <Skeleton active paragraph={{ rows: 5 }} /> : tracks.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : <div style={{ display: 'grid', gap: 8 }}>{tracks.slice(0, 5).map((track, index) => <div key={track.trackId ?? `${track.trackName}-${index}`} style={{ display: 'grid', gridTemplateColumns: '22px 1fr auto auto', gap: 8, alignItems: 'center' }}><Text style={{ color: C.subtle, fontSize: 11 }}>{index + 1}</Text><div style={{ minWidth: 0 }}><Text ellipsis style={{ color: C.text, display: 'block', fontSize: 12 }}>{track.trackName}</Text><Text ellipsis style={{ color: C.subtle, display: 'block', fontSize: 10 }}>{track.artist || 'Unknown artist'}</Text></div><Tag color={track.scope === TrackScopeEnum.BrandOwned ? 'green' : track.scope === TrackScopeEnum.Global ? 'blue' : 'default'} style={{ margin: 0, fontSize: 10 }}>{track.scope === TrackScopeEnum.BrandOwned ? 'Brand-owned' : track.scope === TrackScopeEnum.Global ? 'Global' : 'Unknown'}</Tag><Text style={{ color: C.green, fontSize: 12, fontWeight: 900 }}>{formatNumber(track.plays)}</Text></div>)}</div>}
  </Panel>
);

const Spark = ({ color, seed }: { color: string; seed: number }) => <svg viewBox='0 0 110 58' style={{ width: '100%', maxWidth: 132 }}><polyline fill='none' stroke={color} strokeWidth='2.4' points={Array.from({ length: 14 }, (_, i) => `${i * 8},${48 - (Math.sin(i * .9 + seed) * 14 + Math.cos(i * .45 + seed) * 8 + 18)}`).join(' ')} /></svg>;

const ContextBillingAi = ({ data, loading }: { data: ReturnType<typeof useBrandDashboard>['data']; loading?: boolean }) => (
  <Row gutter={[10, 10]}>
    <Col xs={24} lg={12}><Panel title='Context Intelligence' minHeight={258}>{loading ? <Skeleton active paragraph={{ rows: 5 }} /> : <Row gutter={[8, 8]}>{[{ label: 'People', value: formatNumber(data?.contextIntelligence.avgPeopleCount), color: C.blue, seed: 1 }, { label: 'Noise', value: `${Math.round(data?.contextIntelligence.avgNoiseDecibel ?? 0)} dB`, color: C.green, seed: 2 }, { label: 'Confidence', value: `${Math.round((data?.contextIntelligence.avgFuzzyConfidence ?? 0) * 100)}%`, color: C.orange, seed: 3 }].map((item) => <Col xs={24} md={8} key={item.label}><div style={{ background: 'rgba(255,255,255,.035)', border: `1px solid ${C.borderSoft}`, borderRadius: 8, padding: 10 }}><Text style={{ color: C.subtle, fontSize: 10, fontWeight: 800 }}>{item.label}</Text><div style={{ color: C.text, fontSize: 20, fontWeight: 900 }}>{item.value}</div><Spark color={item.color} seed={item.seed} /></div></Col>)}</Row>}</Panel></Col>
    <Col xs={24} lg={6}><Panel title='Billing' minHeight={258}>{loading ? <Skeleton active paragraph={{ rows: 5 }} /> : <div style={{ display: 'grid', gap: 14 }}><Text style={{ color: C.subtle, fontSize: 11 }}>Wallet</Text><div style={{ color: C.text, fontSize: 26, fontWeight: 900 }}>{formatCompact(data?.billing.balanceTokens)}</div><Progress percent={Math.min(100, ((data?.billing.rangeUsageTokens ?? 0) / Math.max(data?.billing.balanceTokens ?? 1, 1)) * 100)} showInfo={false} strokeColor={C.blue} trailColor='rgba(255,255,255,.1)' /><Text style={{ color: C.subtle, fontSize: 11 }}>{data?.billing.lockStatus === WalletLockStatusEnum.None ? 'Active wallet' : 'Wallet locked'}</Text></div>}</Panel></Col>
    <Col xs={24} lg={6}><Panel title='AI Generation' minHeight={258}>{loading ? <Skeleton active paragraph={{ rows: 5 }} /> : <div style={{ display: 'grid', gap: 9 }}><div style={{ color: C.text, fontSize: 28, fontWeight: 900 }}>{formatNumber(data?.aiGeneration.totalInRange)}</div><Progress percent={data?.aiGeneration.totalInRange ? Math.round((data.aiGeneration.completed / data.aiGeneration.totalInRange) * 100) : 0} showInfo={false} strokeColor={C.green} trailColor='rgba(255,255,255,.1)' />{[['Queued', data?.aiGeneration.queued], ['Processing', data?.aiGeneration.processing], ['Completed', data?.aiGeneration.completed], ['Failed', data?.aiGeneration.failed]].map(([label, value]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}><Text style={{ color: C.muted, fontSize: 12 }}>{label}</Text><Text style={{ color: C.text, fontSize: 12, fontWeight: 900 }}>{value ?? 0}</Text></div>)}</div>}</Panel></Col>
  </Row>
);

export const BrandDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState(BrandDashboardPeriodEnum.Day);
  const filter = useMemo(() => ({ period, top: 10 }), [period]);
  const { data, isLoading, isFetching, refetch } = useBrandDashboard(filter);
  const { isConnected } = useBrandDashboardRealtime({ brandId: user?.brandId, filter });
  const overview = data?.overview;
  const iotRows = data?.iotSpaceHealth ?? [];
  const iotBySpace = useMemo(() => new Map(iotRows.map((row) => [row.spaceId, row])), [iotRows]);

  return (
    <div style={{ paddingBottom: 34 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
        <div><Text style={{ color: C.subtle, fontSize: 12, fontWeight: 800 }}>Brand Manager</Text><Title level={3} style={{ margin: '2px 0 0', color: C.text }}>{data?.brandName ? `${data.brandName} Dashboard` : 'Brand Dashboard'}</Title></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><Segmented size='small' value={period} onChange={(value) => setPeriod(value as BrandDashboardPeriodEnum)} options={[{ label: 'Today', value: 1 }, { label: 'Week', value: 2 }, { label: 'Month', value: 3 }, { label: 'Year', value: 4 }]} /><Tag color={isConnected ? 'success' : 'default'} style={{ margin: 0, fontWeight: 800 }}>{isConnected ? 'Realtime' : 'Snapshot'}</Tag><button onClick={() => refetch()} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.muted, borderRadius: 6, padding: '4px 9px', cursor: 'pointer' }}>{isFetching ? 'Updating...' : `Updated ${formatAgo(data?.generatedAtUtc)}`}</button></div>
      </div>

      <Row gutter={[10, 10]} style={{ marginBottom: 10 }}>
        <Col xs={24} sm={12} lg={5}><KpiCard icon={<CustomerServiceOutlined />} label='Total Stores' value={formatNumber(overview?.totalStores)} detail={`${formatNumber(overview?.activeStores)} active`} loading={isLoading} /></Col>
        <Col xs={24} sm={12} lg={5}><KpiCard icon={<AudioOutlined />} label='Spaces Playing' value={formatNumber(overview?.spacesCurrentlyPlaying)} detail={`${formatNumber(overview?.activeSpaces)} active spaces`} accent={C.blue} loading={isLoading} /></Col>
        <Col xs={24} sm={12} lg={5}><KpiCard icon={<UnorderedListOutlined />} label='Total Plays' value={formatNumber(overview?.totalPlays)} detail={`${formatNumber(overview?.distinctTracksPlayed)} tracks`} loading={isLoading} /></Col>
        <Col xs={24} sm={12} lg={5}><KpiCard icon={<WifiOutlined />} label='IoT Health' value={`${formatNumber(overview?.iotOnlineSpaces)}/${formatNumber(overview?.totalSpaces)}`} detail={`${formatNumber(overview?.iotOfflineSpaces)} offline, ${formatNumber(overview?.iotStaleSpaces)} stale`} accent={C.green} loading={isLoading} /></Col>
        <Col xs={24} sm={12} lg={4}><KpiCard icon={<WalletOutlined />} label='Token Balance' value={formatCompact(data?.billing.balanceTokens)} detail='View details' accent={C.blue} loading={isLoading} /></Col>
      </Row>

      <Row gutter={[10, 10]} style={{ marginBottom: 10 }}>
        <Col xs={24} xl={7}><StoreHealth data={data} loading={isLoading} /></Col>
        <Col xs={24} xl={8}><IotHealth rows={iotRows} loading={isLoading} /></Col>
        <Col xs={24} xl={9}><LivePlayback items={data?.livePlayback.items ?? []} iotBySpace={iotBySpace} topTracks={data?.topTracks ?? []} loading={isLoading} /></Col>
      </Row>

      <Row gutter={[10, 10]} style={{ marginBottom: 10 }}>
        <Col xs={24} xl={7}><TopTracks tracks={data?.topTracks ?? []} loading={isLoading} /></Col>
        <Col xs={24} xl={17}><ContextBillingAi data={data} loading={isLoading} /></Col>
      </Row>

      <div style={{ ...panel(), padding: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(132px, 1fr))', gap: 8 }}>
          {[['Stores', <CustomerServiceOutlined />, '/brand/stores', C.red], ['Playlists', <UnorderedListOutlined />, '/brand/playlists', C.blue], ['Schedules', <CalendarOutlined />, '/brand/schedule', C.orange], ['AI Music', <ThunderboltOutlined />, '/brand/suno-ai', C.red], ['Billing', <WalletOutlined />, '/brand/tokens', C.green]].map(([label, icon, to, color]) => <button key={label as string} onClick={() => navigate(to as string)} style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${C.borderSoft}`, background: 'rgba(255,255,255,.035)', color: C.text, borderRadius: 8, padding: '10px 12px', cursor: 'pointer', fontWeight: 800 }}><span style={{ color: color as string }}>{icon}</span>{label}</button>)}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, color: C.subtle, fontSize: 11, flexWrap: 'wrap', gap: 8 }}><span><Badge status='success' /> All systems operational</span><span>Mood Guide: <span style={{ color: C.chill }}>Chill</span> - <span style={{ color: C.blue }}>Focus</span> - <span style={{ color: C.orange }}>Energetic</span></span></div>
    </div>
  );
};
