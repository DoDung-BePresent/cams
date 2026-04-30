import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Col, Row, Segmented, Skeleton, Typography } from 'antd';
import {
  AudioOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  UsergroupAddOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import { useQueries, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { STALE_TIME } from '@/config';
import { useStores } from '@/features/brand/hooks';
import { storeService } from '@/features/brand/services';
import { useAuth } from '@/providers';
import { EntityStatusEnum } from '@/shared/types';

const { Title, Text } = Typography;

const C = {
  surface: '#18181b',
  surfaceHover: '#242126',
  border: '#2d2528',
  red: '#ef4444',
  text: '#f8f7f7',
  muted: '#b7adb0',
  subtle: '#857b80',
};

const Equalizer = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 24 }}>
    <style>{`
      @keyframes brandEq1 { 0%,100%{height:6px} 50%{height:22px} }
      @keyframes brandEq2 { 0%,100%{height:16px} 40%{height:6px} }
      @keyframes brandEq3 { 0%,100%{height:10px} 60%{height:24px} }
      @keyframes brandEq4 { 0%,100%{height:20px} 25%{height:8px} }
      @keyframes brandEq5 { 0%,100%{height:8px} 50%{height:18px} }
    `}</style>
    {[
      'brandEq1 1.1s ease-in-out infinite',
      'brandEq2 0.85s ease-in-out infinite',
      'brandEq3 1.25s ease-in-out infinite',
      'brandEq4 0.95s ease-in-out infinite',
      'brandEq5 1.15s ease-in-out infinite',
    ].map((animation, index) => (
      <div
        key={index}
        style={{
          width: 4,
          height: 8,
          borderRadius: 2,
          background: C.red,
          animation,
        }}
      />
    ))}
  </div>
);

const StatCard = ({
  label,
  value,
  detail,
  loading,
  accent = C.red,
}: {
  label: string;
  value: number | string;
  detail?: string;
  loading?: boolean;
  accent?: string;
}) => (
  <div
    style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 18,
      minHeight: 120,
    }}
  >
    <Text
      style={{
        color: C.muted,
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 1,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Text>
    <div style={{ marginTop: 10 }}>
      {loading ? (
        <Skeleton.Input
          active
          size='small'
          style={{ width: 70 }}
        />
      ) : (
        <span
          style={{
            color: accent,
            fontSize: 34,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          {value}
        </span>
      )}
    </div>
    {detail && (
      <Text
        style={{
          color: C.subtle,
          fontSize: 12,
          display: 'block',
          marginTop: 8,
        }}
      >
        {detail}
      </Text>
    )}
  </div>
);

const QuickCard = ({
  icon,
  title,
  desc,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '20px 22px',
      cursor: 'pointer',
      transition: 'all 0.18s ease',
      minHeight: 145,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = accent;
      e.currentTarget.style.background = C.surfaceHover;
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = C.border;
      e.currentTarget.style.background = C.surface;
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 12,
        background: `${accent}18`,
        color: accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 21,
        marginBottom: 14,
      }}
    >
      {icon}
    </div>
    <Title
      level={5}
      style={{ margin: '0 0 5px', color: C.text }}
    >
      {title}
    </Title>
    <Text style={{ color: C.muted, fontSize: 13 }}>{desc}</Text>
  </div>
);

export const BrandDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [peopleTrendPeriod, setPeopleTrendPeriod] = useState<'day' | 'month'>(
    'day',
  );

  const { data: storesData, isLoading: storesLoading } = useStores({
    page: 1,
    pageSize: 100,
  });

  const stores = storesData?.items ?? [];
  const activeStores = stores.filter(
    (s) => s.status === EntityStatusEnum.Active,
  );
  const fromUtc = dayjs().startOf('day').toISOString();
  const toUtc = dayjs().endOf('day').toISOString();

  const telemetryQueries = useQueries({
    queries: activeStores.slice(0, 8).map((store) => ({
      queryKey: ['brand-dashboard-store-context', store.id, fromUtc, toUtc],
      queryFn: async () => {
        const response = await storeService.getContextAggregate(store.id, {
          fromUtc,
          toUtc,
        });
        return { store, aggregate: response.data.data };
      },
      staleTime: STALE_TIME.short,
      enabled: Boolean(store.id),
    })),
  });

  const telemetry = telemetryQueries.flatMap((query) => {
    const data = query.data;
    return data?.aggregate
      ? [{ store: data.store, aggregate: data.aggregate }]
      : [];
  });
  const telemetryLoading = telemetryQueries.some((query) => query.isLoading);

  const telemetrySummary = useMemo(() => {
    const rows = telemetry.map((item) => {
      const current = item.aggregate.current;
      return {
        store: item.store,
        samples: current.samples ?? 0,
        crowd: current.crowdDensity.avg ?? null,
        noise: current.noise.avg ?? null,
      };
    });

    const onlineRows = rows.filter((row) => row.samples > 0);
    const rankedByPeople = [...onlineRows].sort(
      (a, b) => (b.crowd ?? 0) - (a.crowd ?? 0),
    );
    const busiestStore = rankedByPeople[0] ?? null;
    const estimatedPeople = Math.round(
      onlineRows.reduce((sum, row) => sum + (row.crowd ?? 0), 0),
    );
    const storesNeedingAttention = rows.filter((row) => row.samples === 0);

    return {
      rows,
      onlineRows,
      rankedByPeople,
      busiestStore,
      estimatedPeople,
      storesNeedingAttention,
    };
  }, [telemetry]);

  const totalStores = storesData?.totalItems ?? 0;
  const activeStoreCount = activeStores.length;
  const inactiveStoreCount = Math.max(totalStores - activeStoreCount, 0);
  const trendFromUtc =
    peopleTrendPeriod === 'day'
      ? dayjs().startOf('day').toISOString()
      : dayjs().startOf('month').toISOString();
  const trendToUtc =
    peopleTrendPeriod === 'day'
      ? dayjs().endOf('day').toISOString()
      : dayjs().endOf('month').toISOString();
  const busiestStoreId = telemetrySummary.busiestStore?.store.id;
  const { data: peopleTrendData, isLoading: peopleTrendLoading } = useQuery({
    queryKey: [
      'brand-dashboard-people-trend',
      busiestStoreId,
      peopleTrendPeriod,
      trendFromUtc,
      trendToUtc,
    ],
    queryFn: async () => {
      const response = await storeService.getContextTimeSeries(
        busiestStoreId!,
        {
          fromUtc: trendFromUtc,
          toUtc: trendToUtc,
          granularity: peopleTrendPeriod === 'day' ? 'hour' : 'day',
        },
      );
      return response.data.data;
    },
    staleTime: STALE_TIME.short,
    enabled: Boolean(busiestStoreId),
  });
  const peopleTrendPoints = peopleTrendData?.points ?? [];
  const maxPeopleTrend = Math.max(
    1,
    ...peopleTrendPoints.map((point) => point.avgCrowdDensity ?? 0),
  );

  return (
    <div style={{ paddingBottom: 40 }}>
      <div
        style={{
          background:
            'radial-gradient(circle at 14% 0%, rgba(239,68,68,0.22), transparent 38%), linear-gradient(135deg, #18181b 0%, #161112 52%, #0f0f11 100%)',
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: '36px 40px',
          marginBottom: 28,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 16,
          }}
        >
          <Equalizer />
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 3,
              color: C.red,
              textTransform: 'uppercase',
            }}
          >
            Brand Manager
          </span>
        </div>
        <Title
          level={2}
          style={{ margin: '0 0 8px', color: C.text }}
        >
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
        </Title>
        <Text style={{ color: C.muted, fontSize: 15 }}>
          Control store operations, music generation, playlist schedules, and
          live IoT context.
        </Text>
      </div>

      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 28 }}
      >
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <StatCard
            label='Total Stores'
            value={totalStores}
            loading={storesLoading}
            detail={`${activeStoreCount} active, ${inactiveStoreCount} inactive`}
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <StatCard
            label='Stores Reporting'
            value={`${telemetrySummary.onlineRows.length}/${Math.min(activeStoreCount, 8)}`}
            loading={telemetryLoading}
            accent='#22c55e'
            detail='Stores with context samples today'
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <StatCard
            label='People In Stores'
            value={
              telemetrySummary.onlineRows.length === 0
                ? 'No data'
                : telemetrySummary.estimatedPeople
            }
            loading={telemetryLoading}
            accent='#3b82f6'
            detail='Estimated from today IoT context'
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <StatCard
            label='Busiest Store'
            value={
              telemetrySummary.busiestStore == null
                ? 'No data'
                : Math.round(telemetrySummary.busiestStore.crowd ?? 0)
            }
            loading={telemetryLoading}
            accent='#f59e0b'
            detail={
              telemetrySummary.busiestStore?.store.name ??
              'Store with most people today'
            }
          />
        </Col>
      </Row>

      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 28 }}
      >
        <Col
          xs={24}
          lg={14}
        >
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 22,
              minHeight: 260,
            }}
          >
            <Text
              style={{
                color: C.subtle,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              People By Store Today
            </Text>
            <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
              {telemetryLoading ? (
                <Skeleton
                  active
                  paragraph={{ rows: 4 }}
                />
              ) : telemetrySummary.rankedByPeople.length === 0 ? (
                <Text style={{ color: C.muted }}>
                  No people data yet. Once IoT reports samples, the busiest
                  stores will appear here.
                </Text>
              ) : (
                telemetrySummary.rankedByPeople
                  .slice(0, 6)
                  .map((row, index) => {
                    const maxPeople = Math.max(
                      1,
                      ...(telemetrySummary.rankedByPeople.map(
                        (item) => item.crowd ?? 0,
                      ) ?? [0]),
                    );
                    const percent = Math.max(
                      5,
                      Math.round(((row.crowd ?? 0) / maxPeople) * 100),
                    );
                    return (
                      <div
                        key={row.store.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          padding: '12px 14px',
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.035)',
                          border: '1px solid rgba(255,255,255,0.06)',
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
                          <div>
                            <Text style={{ color: C.text, fontWeight: 800 }}>
                              {index + 1}. {row.store.name}
                            </Text>
                            <div style={{ color: C.subtle, fontSize: 12 }}>
                              {row.store.city || 'Unknown city'} ·{' '}
                              {row.noise == null
                                ? 'noise unavailable'
                                : `${row.noise.toFixed(0)} dB`}
                            </div>
                          </div>
                          <Text style={{ color: '#3b82f6', fontWeight: 900 }}>
                            {Math.round(row.crowd ?? 0)} people
                          </Text>
                        </div>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 999,
                            background: 'rgba(255,255,255,0.08)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${percent}%`,
                              height: '100%',
                              borderRadius: 999,
                              background:
                                'linear-gradient(90deg, #3b82f6 0%, #ef4444 100%)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </Col>
        <Col
          xs={24}
          lg={10}
        >
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 22,
              minHeight: 260,
            }}
          >
            <Text
              style={{
                color: C.subtle,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              People Trend
            </Text>
            <div style={{ marginTop: 14 }}>
              <Segmented
                value={peopleTrendPeriod}
                onChange={(value) =>
                  setPeopleTrendPeriod(value as 'day' | 'month')
                }
                options={[
                  { label: 'Today', value: 'day' },
                  { label: 'This month', value: 'month' },
                ]}
              />
            </div>
            <div
              style={{
                marginTop: 18,
                minHeight: 170,
                display: 'flex',
                alignItems: 'end',
                gap: 6,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                paddingBottom: 10,
              }}
            >
              {peopleTrendLoading ? (
                <Skeleton
                  active
                  paragraph={{ rows: 4 }}
                />
              ) : peopleTrendPoints.length === 0 ? (
                <Text style={{ color: C.muted, alignSelf: 'center' }}>
                  No trend data for the busiest store yet.
                </Text>
              ) : (
                peopleTrendPoints.map((point) => {
                  const value = point.avgCrowdDensity ?? 0;
                  const height = Math.max(8, (value / maxPeopleTrend) * 150);
                  return (
                    <div
                      key={point.bucketStartUtc}
                      title={`${dayjs(point.bucketStartUtc).format(
                        peopleTrendPeriod === 'day' ? 'HH:mm' : 'DD MMM',
                      )}: ${value.toFixed(1)} people`}
                      style={{
                        flex: 1,
                        minWidth: 5,
                        maxWidth: 28,
                        height,
                        borderRadius: '8px 8px 2px 2px',
                        background:
                          'linear-gradient(180deg, #ef4444 0%, #3b82f6 100%)',
                        boxShadow: '0 8px 18px rgba(59,130,246,0.18)',
                      }}
                    />
                  );
                })
              )}
            </div>
            <Text
              style={{
                color: C.subtle,
                fontSize: 12,
                display: 'block',
                marginTop: 10,
              }}
            >
              {telemetrySummary.busiestStore
                ? `${telemetrySummary.busiestStore.store.name} people trend`
                : 'Trend follows the busiest reporting store'}
            </Text>
          </div>
        </Col>
      </Row>

      <Row
        gutter={[16, 16]}
        style={{ marginBottom: 28 }}
      >
        <Col xs={24}>
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 22,
            }}
          >
            <Text
              style={{
                color: C.subtle,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Manager Actions
            </Text>
            <div
              style={{
                marginTop: 16,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              {[
                {
                  title: 'Review stores without people data',
                  desc: `${telemetrySummary.storesNeedingAttention.length} store(s) need IoT attention today.`,
                  icon: <WifiOutlined />,
                  accent: '#22c55e',
                  to: '/brand/stores',
                },
                {
                  title: 'Create or manage spaces',
                  desc: 'Open a store, add spaces, pair devices, and manage music.',
                  icon: <EnvironmentOutlined />,
                  accent: '#3b82f6',
                  to: '/brand/stores',
                },
                {
                  title: 'Generate campaign music',
                  desc: 'Create AI tracks and drop them into brand playlists.',
                  icon: <ThunderboltOutlined />,
                  accent: '#ef4444',
                  to: '/brand/suno-ai',
                },
                {
                  title: 'Schedule the right playlist',
                  desc: 'Assign morning, rush-hour, or evening slots.',
                  icon: <CalendarOutlined />,
                  accent: '#a855f7',
                  to: '/brand/schedule',
                },
              ].map((action) => (
                <div
                  key={action.title}
                  onClick={() => navigate(action.to)}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: 14,
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.035)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{ color: action.accent, fontSize: 20 }}>
                    {action.icon}
                  </div>
                  <div>
                    <Text style={{ color: C.text, fontWeight: 800 }}>
                      {action.title}
                    </Text>
                    <div style={{ color: C.muted, fontSize: 12 }}>
                      {action.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>

      <Text
        style={{
          color: C.subtle,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 2,
          textTransform: 'uppercase',
          display: 'block',
          marginBottom: 16,
        }}
      >
        Quick Access
      </Text>
      <Row gutter={[16, 16]}>
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <QuickCard
            icon={<EnvironmentOutlined />}
            title='Stores'
            desc='Manage locations, status, device setup, and store policies'
            accent={C.red}
            onClick={() => navigate('/brand/stores')}
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <QuickCard
            icon={<AudioOutlined />}
            title='Playlists'
            desc='Curate brand playlists and add generated tracks'
            accent='#3b82f6'
            onClick={() => navigate('/brand/playlists')}
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <QuickCard
            icon={<CalendarOutlined />}
            title='Schedules'
            desc='Set playback windows for stores and spaces'
            accent='#a855f7'
            onClick={() => navigate('/brand/schedule')}
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <QuickCard
            icon={<UnorderedListOutlined />}
            title='Tracks'
            desc='Review track library, metadata, and availability'
            accent='#f59e0b'
            onClick={() => navigate('/brand/tracks')}
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <QuickCard
            icon={<ThunderboltOutlined />}
            title='AI Music Generator'
            desc='Generate branded tracks for playlists and schedules'
            accent='#ef4444'
            onClick={() => navigate('/brand/suno-ai')}
          />
        </Col>
        <Col
          xs={24}
          sm={12}
          lg={6}
        >
          <QuickCard
            icon={<UsergroupAddOutlined />}
            title='Staff'
            desc='Assign store managers and operational access'
            accent='#22c55e'
            onClick={() => navigate('/brand/staff')}
          />
        </Col>
      </Row>
    </div>
  );
};
