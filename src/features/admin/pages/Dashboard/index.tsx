import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import {
  Col,
  Progress,
  Row,
  Segmented,
  Skeleton,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  ApiOutlined,
  AppstoreOutlined,
  CloudServerOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  LineChartOutlined,
  PlayCircleOutlined,
  RobotOutlined,
  ShopOutlined,
  SoundOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';

import { useAdminDashboard } from '@/features/admin/hooks';
import { useAuth } from '@/providers';
import type {
  AdminBrandHealthItem,
  AdminDashboardTopTrackItem,
  DashboardPeriod,
} from '@/features/admin/types';

const { Title, Text } = Typography;

const C = {
  surface: '#18181b',
  surface2: '#121214',
  surfaceHover: '#242126',
  border: '#2d2528',
  red: '#ef4444',
  green: '#22c55e',
  amber: '#f59e0b',
  blue: '#3b82f6',
  purple: '#a855f7',
  text: '#f8f7f7',
  muted: '#b7adb0',
  subtle: '#857b80',
};
const QUICK_ACCESS_ITEMS = [
  {
    label: 'Brand Management',
    description: 'Create brands, review status, and manage brand policies',
    path: '/admin/brands',
    icon: <ShopOutlined />,
    accent: C.green,
  },
  {
    label: 'Manager Accounts',
    description: 'Create accounts and assign brand or store ownership',
    path: '/admin/accounts',
    icon: <UserOutlined />,
    accent: C.blue,
  },
  {
    label: 'Billing & Tokens',
    description: 'Packages, wallets, token top-up, and lock status',
    path: '/admin/billing-packages',
    icon: <WalletOutlined />,
    accent: C.green,
  },
  {
    label: 'IoT Management',
    description: 'Device health, telemetry freshness, and commands',
    path: '/admin/iot',
    icon: <CloudServerOutlined />,
    accent: C.amber,
  },
  {
    label: 'Track Library',
    description: 'Global tracks, review status, and playback-ready assets',
    path: '/admin/tracks',
    icon: <SoundOutlined />,
    accent: C.red,
  },
];

const formatNumber = (value?: number | null) =>
  typeof value === 'number'
    ? new Intl.NumberFormat('en-US').format(value)
    : '0';

const formatCompact = (value?: number | null) =>
  typeof value === 'number'
    ? new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value)
    : '0';

const trendText = (delta?: number | null, suffix = '') => {
  if (!delta) return 'No change';
  return `${delta > 0 ? '+' : ''}${formatNumber(delta)}${suffix}`;
};

const Equalizer = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 22 }}>
    <style>{`
      @keyframes adminEq1 { 0%,100%{height:6px} 50%{height:20px} }
      @keyframes adminEq2 { 0%,100%{height:15px} 40%{height:7px} }
      @keyframes adminEq3 { 0%,100%{height:10px} 60%{height:22px} }
      @keyframes adminEq4 { 0%,100%{height:18px} 30%{height:8px} }
    `}</style>
    {[
      'adminEq1 1.1s ease-in-out infinite',
      'adminEq2 0.9s ease-in-out infinite',
      'adminEq3 1.25s ease-in-out infinite',
      'adminEq4 1s ease-in-out infinite',
    ].map((animation, index) => (
      <div
        key={index}
        style={{
          width: 4,
          height: 10,
          borderRadius: 2,
          background: index === 1 ? C.amber : C.red,
          animation,
        }}
      />
    ))}
  </div>
);

const StatCard = ({
  icon,
  label,
  value,
  sub,
  trend,
  accent = C.red,
  loading,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  sub: string;
  trend?: string;
  accent?: string;
  loading?: boolean;
}) => (
  <div
    style={{
      minHeight: 132,
      height: '100%',
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: 18,
      display: 'flex',
      gap: 14,
    }}
  >
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 8,
        background: `${accent}18`,
        color: accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <Text style={{ color: C.muted, fontSize: 12, fontWeight: 800 }}>
        {label}
      </Text>
      <div style={{ marginTop: 10 }}>
        {loading ? (
          <Skeleton.Input
            active
            size='small'
            style={{ width: 78 }}
          />
        ) : (
          <span
            style={{
              color: C.text,
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            {value}
          </span>
        )}
      </div>
      <Text
        style={{ color: C.muted, display: 'block', marginTop: 8, fontSize: 12 }}
      >
        {sub}
      </Text>
      {trend && (
        <Text
          style={{
            color: trend.startsWith('-') ? C.red : C.green,
            fontWeight: 800,
            fontSize: 11,
          }}
        >
          {trend}
        </Text>
      )}
    </div>
  </div>
);

const Panel = ({
  title,
  extra,
  children,
}: {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}) => (
  <div
    style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: 16,
      height: '100%',
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 14,
      }}
    >
      <Title
        level={5}
        style={{ margin: 0, color: C.text }}
      >
        {title}
      </Title>
      {extra}
    </div>
    {children}
  </div>
);

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<DashboardPeriod>(1);
  const { data: result, isLoading } = useAdminDashboard({ period, top: 6 });
  const data = result?.data;

  const iotPercent = useMemo(() => {
    const assigned = data?.iotHealth.assignedDevices ?? 0;
    if (assigned === 0) return 0;
    return Math.round(((data?.iotHealth.onlineDevices ?? 0) / assigned) * 100);
  }, [data]);

  const brandColumns = [
    {
      title: 'Brand',
      dataIndex: 'brandName',
      render: (value: string, record: AdminBrandHealthItem) => (
        <div>
          <Text style={{ color: C.text, fontWeight: 800 }}>{value}</Text>
          <Text style={{ display: 'block', color: C.subtle, fontSize: 12 }}>
            {record.stores} stores / {record.spaces} spaces
          </Text>
        </div>
      ),
    },
    {
      title: 'Playback',
      dataIndex: 'playingSpaces',
      width: 110,
      render: (value: number) => (
        <Tag color={value > 0 ? 'green' : 'default'}>{value} live</Tag>
      ),
    },
    {
      title: 'IoT',
      width: 135,
      render: (_: unknown, record: AdminBrandHealthItem) => (
        <Text
          style={{
            color: record.offlineDevices > 0 ? C.amber : C.green,
            fontWeight: 800,
          }}
        >
          {record.onlineDevices}/{record.assignedDevices}
        </Text>
      ),
    },
    {
      title: 'Wallet',
      dataIndex: 'balanceTokens',
      width: 110,
      render: (value: number) => (
        <Text style={{ color: C.text }}>{formatCompact(value)}</Text>
      ),
    },
  ];

  const trackColumns = [
    {
      title: 'Track',
      dataIndex: 'trackName',
      render: (value: string, record: AdminDashboardTopTrackItem) => (
        <div>
          <Text style={{ color: C.text, fontWeight: 800 }}>{value}</Text>
          <Text style={{ display: 'block', color: C.subtle, fontSize: 12 }}>
            {record.artist || 'Unknown artist'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Scope',
      dataIndex: 'scope',
      width: 96,
      render: (value: number) => (
        <Tag color={value === 1 ? 'blue' : 'green'}>
          {value === 1 ? 'Global' : 'Brand'}
        </Tag>
      ),
    },
    {
      title: 'Plays',
      dataIndex: 'plays',
      width: 82,
      render: (value: number) => (
        <Text style={{ color: C.green, fontWeight: 900 }}>{value}</Text>
      ),
    },
  ];

  return (
    <div style={{ paddingBottom: 36 }}>
      <div
        style={{
          background:
            'radial-gradient(circle at 12% 0%, rgba(239,68,68,0.22), transparent 30%), radial-gradient(circle at 84% 20%, rgba(245,158,11,0.12), transparent 24%), linear-gradient(135deg, #18181b 0%, #161112 56%, #0f0f11 100%)',
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: '24px 28px',
          marginBottom: 18,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 20,
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <Equalizer />
            <span
              style={{
                color: C.red,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 3,
              }}
            >
              SYSTEM ADMIN
            </span>
          </div>
          <Title
            level={2}
            style={{ margin: 0, color: C.text }}
          >
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
          </Title>
          <Text style={{ color: C.muted }}>
            Monitor platform health, IoT command readiness, playback, billing,
            and AI generation.
          </Text>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <Segmented
            size='small'
            value={period}
            onChange={(value) => setPeriod(value as DashboardPeriod)}
            options={[
              { label: 'Today', value: 1 },
              { label: 'Week', value: 2 },
              { label: 'Month', value: 3 },
              { label: 'Year', value: 4 },
            ]}
          />
          <Tag color='red'>Realtime</Tag>
          <Tag color='default'>Updated {data ? 'now' : '...'}</Tag>
        </div>
      </div>

      <Row
        gutter={[12, 12]}
        style={{ marginBottom: 12 }}
      >
        <Col
          xs={24}
          md={12}
          xl={6}
        >
          <StatCard
            icon={<AppstoreOutlined />}
            label='Brands'
            value={formatNumber(data?.overview.totalBrands)}
            sub={`${formatNumber(data?.overview.activeBrands)} active brands`}
            trend={trendText(data?.overview.totalBrandsTrend.delta)}
            loading={isLoading}
          />
        </Col>
        <Col
          xs={24}
          md={12}
          xl={6}
        >
          <StatCard
            icon={<ShopOutlined />}
            label='Stores / Spaces'
            value={`${formatNumber(data?.overview.totalStores)} / ${formatNumber(data?.overview.totalSpaces)}`}
            sub={`${formatNumber(data?.overview.activeSpaces)} active spaces`}
            trend={trendText(data?.overview.totalSpacesTrend.delta, ' spaces')}
            accent={C.blue}
            loading={isLoading}
          />
        </Col>
        <Col
          xs={24}
          md={12}
          xl={6}
        >
          <StatCard
            icon={<PlayCircleOutlined />}
            label='Live Playback'
            value={formatNumber(data?.overview.spacesCurrentlyPlaying)}
            sub={`${formatNumber(data?.overview.spacesPaused)} paused, ${formatNumber(data?.overview.spacesManualOverride)} manual`}
            trend={trendText(data?.overview.totalPlaysTrend.delta, ' plays')}
            accent={C.green}
            loading={isLoading}
          />
        </Col>
        <Col
          xs={24}
          md={12}
          xl={6}
        >
          <StatCard
            icon={<CloudServerOutlined />}
            label='IoT Health'
            value={`${iotPercent}%`}
            sub={`${formatNumber(data?.iotHealth.onlineDevices)} online / ${formatNumber(data?.iotHealth.assignedDevices)} assigned`}
            trend={`${formatNumber((data?.iotHealth.offlineDevices ?? 0) + (data?.iotHealth.staleDevices ?? 0))} devices need attention`}
            accent={C.amber}
            loading={isLoading}
          />
        </Col>
      </Row>

      <Row
        gutter={[12, 12]}
        style={{ marginBottom: 12 }}
      >
        <Col
          xs={24}
          xl={10}
        >
          <Panel
            title='Brand Health'
            extra={
              <Text
                onClick={() => navigate('/admin/iot')}
                style={{ color: C.blue, cursor: 'pointer' }}
              >
                IoT details
              </Text>
            }
          >
            <Table
              rowKey='brandId'
              size='small'
              pagination={false}
              loading={isLoading}
              columns={brandColumns}
              dataSource={data?.brandHealth ?? []}
            />
          </Panel>
        </Col>
        <Col
          xs={24}
          xl={8}
        >
          <Panel
            title='IoT Command Center'
            extra={<ApiOutlined style={{ color: C.amber }} />}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 16,
              }}
            >
              {[
                ['Assigned', data?.iotHealth.assignedDevices, C.blue],
                ['Online', data?.iotHealth.onlineDevices, C.green],
                ['Offline', data?.iotHealth.offlineDevices, C.red],
                ['Stale', data?.iotHealth.staleDevices, C.amber],
              ].map(([label, value, color]) => (
                <div
                  key={label as string}
                  style={{
                    background: C.surface2,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <Text style={{ color: C.subtle, fontSize: 12 }}>{label}</Text>
                  <div
                    style={{
                      color: color as string,
                      fontSize: 24,
                      fontWeight: 900,
                    }}
                  >
                    {formatNumber(value as number)}
                  </div>
                </div>
              ))}
            </div>
            <Progress
              percent={iotPercent}
              strokeColor={C.green}
              trailColor='#333'
            />
            <Text style={{ color: C.muted, fontSize: 12 }}>
              {formatNumber(
                (data?.iotHealth.offlineDevices ?? 0) +
                  (data?.iotHealth.staleDevices ?? 0),
              )}{' '}
              offline or stale devices.
            </Text>
          </Panel>
        </Col>
        <Col
          xs={24}
          xl={6}
        >
          <Panel
            title='Platform Billing'
            extra={<WalletOutlined style={{ color: C.green }} />}
          >
            <div style={{ color: C.text, fontSize: 34, fontWeight: 900 }}>
              {formatCompact(data?.billing.totalBalanceTokens)}
            </div>
            <Text style={{ color: C.muted, display: 'block' }}>
              Total wallet balance
            </Text>
            <Text
              style={{
                color: C.red,
                display: 'block',
                marginTop: 12,
                fontWeight: 800,
              }}
            >
              {formatNumber(data?.billing.lockedWallets)} locked wallets
            </Text>
            <Text style={{ color: C.green, display: 'block', marginTop: 8 }}>
              {trendText(data?.billing.rangeUsageTrend.delta, ' tokens used')}
            </Text>
          </Panel>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col
          xs={24}
          xl={10}
        >
          <Panel
            title='Top Tracks'
            extra={<CustomerServiceOutlined style={{ color: C.purple }} />}
          >
            <Table
              rowKey={(row) => row.trackId || row.trackName}
              size='small'
              pagination={false}
              loading={isLoading}
              columns={trackColumns}
              dataSource={data?.topTracks ?? []}
            />
          </Panel>
        </Col>
        <Col
          xs={24}
          xl={7}
        >
          <Panel
            title='Live Spaces'
            extra={<LineChartOutlined style={{ color: C.blue }} />}
          >
            {(data?.livePlayback.items ?? []).map((item) => (
              <div
                key={item.spaceId}
                style={{
                  borderBottom: `1px solid ${C.border}`,
                  padding: '9px 0',
                }}
              >
                <Text style={{ color: C.text, fontWeight: 800 }}>
                  {item.spaceName}
                </Text>
                <Text
                  style={{ color: C.subtle, display: 'block', fontSize: 12 }}
                >
                  {item.brandName} / {item.storeName}
                </Text>
                <Tag color={item.isPaused ? 'gold' : 'green'}>
                  {item.isPaused ? 'Paused' : 'Playing'}
                </Tag>
                {item.isManualOverride && <Tag color='red'>Manual</Tag>}
              </div>
            ))}
          </Panel>
        </Col>
        <Col
          xs={24}
          xl={7}
        >
          <Panel
            title='AI Generation'
            extra={<RobotOutlined style={{ color: C.red }} />}
          >
            <div style={{ color: C.text, fontSize: 34, fontWeight: 900 }}>
              {formatNumber(data?.aiGeneration.totalInRange)}
            </div>
            <Text
              style={{ color: C.muted, display: 'block', marginBottom: 14 }}
            >
              Requests in range
            </Text>
            {[
              ['Queued', data?.aiGeneration.queued],
              ['Processing', data?.aiGeneration.processing],
              ['Completed', data?.aiGeneration.completed],
              ['Failed', data?.aiGeneration.failed],
            ].map(([label, value]) => (
              <div
                key={label as string}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: C.muted }}>{label}</Text>
                <Text style={{ color: C.text, fontWeight: 900 }}>
                  {formatNumber(value as number)}
                </Text>
              </div>
            ))}
          </Panel>
        </Col>
      </Row>
      <div
        style={{
          marginTop: 12,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <Text style={{ color: C.text, fontWeight: 950 }}>Quick Access</Text>
            <Text style={{ color: C.muted, display: 'block', fontSize: 12 }}>
              Open the admin areas used most often during daily operations.
            </Text>
          </div>
          <DashboardOutlined style={{ color: C.amber, fontSize: 20 }} />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 10,
          }}
        >
          {QUICK_ACCESS_ITEMS.map((item) => (
            <button
              key={item.path}
              type='button'
              onClick={() => navigate(item.path)}
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                background: C.surface2,
                padding: 12,
                cursor: 'pointer',
                display: 'grid',
                gridTemplateColumns: '34px minmax(0, 1fr)',
                gap: 10,
                alignItems: 'center',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: `${item.accent}18`,
                  color: item.accent,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 17,
                }}
              >
                {item.icon}
              </span>
              <span style={{ minWidth: 0 }}>
                <Text
                  ellipsis
                  style={{ color: C.text, fontWeight: 900, display: 'block' }}
                >
                  {item.label}
                </Text>
                <Text
                  ellipsis
                  style={{ color: C.muted, display: 'block', fontSize: 11 }}
                >
                  {item.description}
                </Text>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
